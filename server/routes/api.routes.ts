import fs from 'fs';
import path from 'path';
import { Router, Request, Response } from 'express';
import { getTodayStatus, getRecentRuns, getResultsByRunId } from '../db/queries';
import { loadEmployees, checkDailySubmissions } from '../services/checker.service';
import { sendReminders } from '../services/reminder.service';
import { getSchedulerStatus, startScheduler, stopScheduler } from '../services/scheduler.service';
import { getTodayDateString, isWeekday, isPastDeadline } from '../utils/date';
import { isGmailConfigured, isGmailAuthenticated } from '../services/gmail.service';

import type { Employee } from '../types';
import { env } from '../config/env';

const router = Router();

function getAllRawEmployees(): Employee[] {
  const filePath = env.EMPLOYEES_FILE;
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function persistEmployees(list: Employee[]): void {
  const targetPath = env.EMPLOYEES_FILE || path.resolve(process.cwd(), 'data', 'employees.json');
  fs.writeFileSync(targetPath, JSON.stringify(list, null, 2), 'utf-8');
}

// GET /api/status - Get today's compliance status
router.get('/status', (_req: Request, res: Response) => {
  const todayStr = getTodayDateString();
  const employees = loadEmployees();
  const todayData = getTodayStatus(todayStr);

  res.json({
    date: todayStr,
    isWeekday: isWeekday(new Date()),
    totalEmployees: employees.length,
    latestRun: todayData.run,
    results: todayData.results,
    gmail: {
      configured: isGmailConfigured(),
      authenticated: isGmailAuthenticated()
    }
  });
});

// POST /api/check - Trigger a manual check and dispatch reminders if requested
router.post('/check', async (req: Request, res: Response) => {
  try {
    const isPast8PM = isPastDeadline(new Date(), 20);
    // Reminders are strictly dispatched only after 8 PM (unless explicitly forced)
    const shouldSendReminders = req.body.forceReminders === true || (isPast8PM && req.body.sendReminders !== false);
    console.log(`Manual check triggered. Send reminders: ${shouldSendReminders} (Past 8 PM: ${isPast8PM})`);

    const result = await checkDailySubmissions('manual');

    let remindersDispatched = 0;
    if (shouldSendReminders && result.missing.length > 0) {
      const reminderRes = await sendReminders(result.missing, result.runId);
      remindersDispatched = reminderRes.sentCount;
    }

    res.json({
      success: true,
      data: result,
      remindersSent: remindersDispatched
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

// POST /api/remind - Send reminders to specific missing employee or all missing from run
router.post('/remind', async (req: Request, res: Response) => {
  try {
    const { runId, employeeId } = req.body;
    if (!runId) {
      res.status(400).json({ error: 'runId is required' });
      return;
    }

    const employees = loadEmployees();
    let targetEmployees = employees;

    if (employeeId) {
      targetEmployees = employees.filter(e => e.id === employeeId);
      if (targetEmployees.length === 0) {
        res.status(404).json({ error: 'Employee not found' });
        return;
      }
    } else {
      const results = getResultsByRunId(runId);
      const missingIds = new Set(results.filter(r => r.status === 'missing').map(r => r.employee_id));
      targetEmployees = employees.filter(e => missingIds.has(e.id));
    }

    const reminderResult = await sendReminders(targetEmployees, runId);
    res.json({ success: true, data: reminderResult });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

// GET /api/logs - Historical runs list
router.get('/logs', (req: Request, res: Response) => {
  const limit = parseInt((req.query.limit as string) || '20', 10);
  const runs = getRecentRuns(limit);
  res.json({ runs });
});

// GET /api/logs/:runId - Detailed results for a specific run
router.get('/logs/:runId', (req: Request, res: Response) => {
  const runId = parseInt(String(req.params.runId), 10);
  if (isNaN(runId)) {
    res.status(400).json({ error: 'Invalid runId' });
    return;
  }

  const results = getResultsByRunId(runId);
  res.json({ runId, results });
});

// GET /api/employees - Active employees roster
router.get('/employees', (_req: Request, res: Response) => {
  const employees = loadEmployees();
  res.json({ employees });
});

// POST /api/employees - Add new intern
router.post('/employees', (req: Request, res: Response) => {
  try {
    const { name, email, role } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'Name must be at least 2 characters long' });
      return;
    }
    const cleanEmail = (email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ error: 'A valid email address is required' });
      return;
    }

    const all = getAllRawEmployees();
    if (all.some(e => e.email.trim().toLowerCase() === cleanEmail)) {
      res.status(400).json({ error: `An intern with email "${cleanEmail}" already exists` });
      return;
    }

    // Generate next unique ID
    let maxNum = 0;
    for (const e of all) {
      const match = e.id.match(/^emp_(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextId = `emp_${String(maxNum + 1).padStart(2, '0')}`;

    const newEmp: Employee = {
      id: nextId,
      name: name.trim(),
      email: cleanEmail,
      role: (role || 'Intern').trim(),
      active: true
    };

    all.push(newEmp);
    persistEmployees(all);

    res.status(201).json({ success: true, employee: newEmp });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add intern';
    res.status(500).json({ error: message });
  }
});

// PUT /api/employees/:id - Update existing intern details or Gmail
router.put('/employees/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, active } = req.body;

    const all = getAllRawEmployees();
    const idx = all.findIndex(e => e.id === id);
    if (idx === -1) {
      res.status(404).json({ error: `Intern with ID "${id}" not found` });
      return;
    }

    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        res.status(400).json({ error: 'A valid email address is required' });
        return;
      }
      if (all.some((e, i) => i !== idx && e.email.trim().toLowerCase() === cleanEmail)) {
        res.status(400).json({ error: `Another intern with email "${cleanEmail}" already exists` });
        return;
      }
      all[idx].email = cleanEmail;
    }

    if (name && typeof name === 'string' && name.trim().length >= 2) {
      all[idx].name = name.trim();
    }
    if (role && typeof role === 'string' && role.trim()) {
      all[idx].role = role.trim();
    }
    if (typeof active === 'boolean') {
      all[idx].active = active;
    }

    persistEmployees(all);

    res.json({ success: true, employee: all[idx] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update intern';
    res.status(500).json({ error: message });
  }
});

// DELETE /api/employees/:id - Remove an intern
router.delete('/employees/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const all = getAllRawEmployees();
    const filtered = all.filter(e => e.id !== id);
    if (filtered.length === all.length) {
      res.status(404).json({ error: `Intern with ID "${id}" not found` });
      return;
    }
    persistEmployees(filtered);
    res.json({ success: true, message: `Intern ${id} removed successfully` });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to remove intern';
    res.status(500).json({ error: message });
  }
});

// GET /api/scheduler - Scheduler status
router.get('/scheduler', (_req: Request, res: Response) => {
  res.json(getSchedulerStatus());
});

// POST /api/scheduler/start
router.post('/scheduler/start', (_req: Request, res: Response) => {
  startScheduler();
  res.json({ success: true, status: getSchedulerStatus() });
});

// POST /api/scheduler/stop
router.post('/scheduler/stop', (_req: Request, res: Response) => {
  stopScheduler();
  res.json({ success: true, status: getSchedulerStatus() });
});

// GET /api/reports - Daily report data for Performance Dashboard (Task 2)
router.get('/reports', (_req: Request, res: Response) => {
  try {
    const reportsPath = path.resolve(process.cwd(), 'data', 'daily-reports.json');
    if (!fs.existsSync(reportsPath)) {
      res.json({ reports: [] });
      return;
    }
    const raw = fs.readFileSync(reportsPath, 'utf-8');
    const reports = JSON.parse(raw);
    res.json({ reports });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to read reports';
    res.status(500).json({ error: message });
  }
});

// POST /api/reports/score - Submit or update manager rating and evaluation for an intern
router.post('/reports/score', (req: Request, res: Response) => {
  try {
    const {
      employee_id,
      date,
      manager_rating,
      self_rating,
      status: taskStatus,
      severity,
      deadline_met,
      category: reqCategory,
      tasks,
      tomorrows_tasks,
      link
    } = req.body;

    if (!employee_id) {
      res.status(400).json({ error: 'employee_id is required' });
      return;
    }

    const ratingNum = Number(manager_rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 10) {
      res.status(400).json({ error: 'manager_rating must be a number between 1 and 10' });
      return;
    }

    const employees = getAllRawEmployees();
    const emp = employees.find(e => e.id === employee_id);
    if (!emp) {
      res.status(404).json({ error: `Employee ${employee_id} not found` });
      return;
    }

    const targetDate = date || getTodayDateString();
    const reportsPath = path.resolve(process.cwd(), 'data', 'daily-reports.json');
    let reports: any[] = [];
    if (fs.existsSync(reportsPath)) {
      reports = JSON.parse(fs.readFileSync(reportsPath, 'utf-8'));
    }

    const existingIdx = reports.findIndex(r => r.date === targetDate && r.employee_id === employee_id);

    const defaultCategory = emp.role.toLowerCase().includes('backend') ? 'Backend'
      : emp.role.toLowerCase().includes('frontend') ? 'Frontend'
      : emp.role.toLowerCase().includes('qa') || emp.role.toLowerCase().includes('testing') ? 'Testing'
      : emp.role.toLowerCase().includes('devops') ? 'DevOps'
      : emp.role.toLowerCase().includes('lead') || emp.role.toLowerCase().includes('management') ? 'Management'
      : 'Development';

    const category = reqCategory || (existingIdx >= 0 ? reports[existingIdx].category : defaultCategory);

    const entry = {
      date: targetDate,
      employee_id,
      name: emp.name,
      role: emp.role,
      tasks: tasks || (existingIdx >= 0 ? reports[existingIdx].tasks : 'Daily task deliverable completed'),
      tomorrows_tasks: tomorrows_tasks || (existingIdx >= 0 ? reports[existingIdx].tomorrows_tasks : 'Continue sprint backlog deliverables'),
      category,
      status: taskStatus || (existingIdx >= 0 ? reports[existingIdx].status : 'Completed'),
      severity: severity || (existingIdx >= 0 ? reports[existingIdx].severity : 'High'),
      self_rating: self_rating !== undefined ? Number(self_rating) : (existingIdx >= 0 ? reports[existingIdx].self_rating : Math.min(10, Math.max(1, ratingNum))),
      manager_rating: ratingNum,
      deadline_met: typeof deadline_met === 'boolean' ? deadline_met : (existingIdx >= 0 ? reports[existingIdx].deadline_met : true),
      link: link !== undefined ? link : (existingIdx >= 0 ? reports[existingIdx].link : '')
    };

    if (existingIdx >= 0) {
      reports[existingIdx] = { ...reports[existingIdx], ...entry };
    } else {
      reports.push(entry);
    }

    fs.writeFileSync(reportsPath, JSON.stringify(reports, null, 2), 'utf-8');
    res.json({ success: true, report: entry });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save score';
    res.status(500).json({ error: message });
  }
});

export default router;
