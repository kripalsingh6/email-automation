import { Router, Request, Response } from 'express';
import { getTodayStatus, getRecentRuns, getResultsByRunId } from '../db/queries';
import { loadEmployees, checkDailySubmissions } from '../services/checker.service';
import { sendReminders } from '../services/reminder.service';
import { getSchedulerStatus, startScheduler, stopScheduler } from '../services/scheduler.service';
import { getTodayDateString, isWeekday } from '../utils/date';
import { isGmailConfigured, isGmailAuthenticated } from '../services/gmail.service';

const router = Router();

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
    const shouldSendReminders = req.body.sendReminders !== false; // default true
    console.log(`Manual check triggered. Send reminders: ${shouldSendReminders}`);

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

export default router;
