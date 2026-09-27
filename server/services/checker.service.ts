import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import type { Employee, CheckResult, CheckExecutionResult, SubmissionStatus } from '../types';
import { getTodayDateString, isPastDeadline } from '../utils/date';
import { buildGmailQuery, matchesExpectedSubject } from '../utils/parser';
import { searchEmails } from './gmail.service';
import { insertCheckRun, insertCheckResultsBatch } from '../db/queries';

export function loadEmployees(): Employee[] {
  const filePath = env.EMPLOYEES_FILE;
  if (!fs.existsSync(filePath)) {
    throw new Error(`Employees file not found at ${env.EMPLOYEES_FILE}`);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const employees: Employee[] = JSON.parse(raw);
  const leadEmail = (env.TEAM_LEAD_EMAIL || '').trim().toLowerCase();
  return employees.filter(emp => emp.active && emp.email.trim().toLowerCase() !== leadEmail);
}

// Concurrency helper: processes items in chunks of given size
async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const chunkResults = await Promise.all(chunk.map(fn));
    results.push(...chunkResults);
  }
  return results;
}

export async function checkDailySubmissions(
  trigger: 'scheduled' | 'manual' = 'manual'
): Promise<CheckExecutionResult> {
  const today = new Date();
  const runDate = getTodayDateString(today);
  const runTime = today.toISOString();
  const isPast8PM = isPastDeadline(today, 20);

  const activeEmployees = loadEmployees();
  console.log(`🔍 [Checker Service] Starting ${trigger} check for ${activeEmployees.length} active employees on ${runDate} (Past 8 PM: ${isPast8PM})...`);

  // Check each employee against Gmail inbox (max 3 concurrent queries)
  const employeeResults = await processInBatches(activeEmployees, 3, async (emp) => {
    try {
      const query = buildGmailQuery(emp.name, emp.email, runDate);
      const emails = await searchEmails(query);

      // Find an email that matches the expected daily task subject pattern
      const matchedEmail = emails.find(e => matchesExpectedSubject(e.subject, emp.name, today));

      if (matchedEmail) {
        return {
          employee: emp,
          status: 'submitted' as SubmissionStatus,
          subjectFound: matchedEmail.subject
        };
      } else {
        return {
          employee: emp,
          status: (isPast8PM ? 'missing' : 'pending') as SubmissionStatus,
          subjectFound: undefined
        };
      }
    } catch (err) {
      console.error(`⚠️ Error checking email for ${emp.name}:`, err);
      return {
        employee: emp,
        status: (isPast8PM ? 'missing' : 'pending') as SubmissionStatus,
        subjectFound: undefined
      };
    }
  });

function recordDailyReportSubmission(date: string, emp: Employee, snippetOrSubject: string) {
  try {
    const reportsPath = path.resolve(process.cwd(), 'data', 'daily-reports.json');
    let reports: any[] = [];
    if (fs.existsSync(reportsPath)) {
      reports = JSON.parse(fs.readFileSync(reportsPath, 'utf-8'));
    }
    const existingIndex = reports.findIndex(r => r.date === date && r.employee_id === emp.id);
    const category = emp.role.toLowerCase().includes('backend') ? 'Backend'
      : emp.role.toLowerCase().includes('frontend') ? 'Frontend'
      : emp.role.toLowerCase().includes('qa') || emp.role.toLowerCase().includes('testing') ? 'Testing'
      : emp.role.toLowerCase().includes('devops') ? 'DevOps'
      : emp.role.toLowerCase().includes('lead') || emp.role.toLowerCase().includes('management') ? 'Management'
      : 'Development';

    const reportEntry = {
      date,
      employee_id: emp.id,
      name: emp.name,
      role: emp.role,
      tasks: snippetOrSubject || 'Completed daily deliverables',
      tomorrows_tasks: 'Continue sprint backlog deliverables',
      category,
      status: 'Completed',
      severity: 'High',
      self_rating: 9,
      manager_rating: 9,
      deadline_met: true,
      link: ''
    };

    if (existingIndex >= 0) {
      reports[existingIndex] = { ...reports[existingIndex], ...reportEntry };
    } else {
      reports.push(reportEntry);
    }

    fs.writeFileSync(reportsPath, JSON.stringify(reports, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to sync daily report submission:', err);
  }
}

  const submitted = employeeResults.filter(r => r.status === 'submitted').map(r => r.employee);
  const missing = employeeResults.filter(r => r.status === 'missing').map(r => r.employee);

  // Sync all verified submissions directly to ML & Performance graphs dataset
  for (const r of employeeResults) {
    if (r.status === 'submitted') {
      recordDailyReportSubmission(runDate, r.employee, r.subjectFound || 'Daily update submitted');
    }
  }

  // Record check_run in DB
  const runId = insertCheckRun({
    run_date: runDate,
    run_time: runTime,
    trigger,
    total: activeEmployees.length,
    submitted: submitted.length,
    missing: missing.length
  });

  // Prepare and record check_results in DB
  const checkResultRows: Omit<CheckResult, 'id'>[] = employeeResults.map(r => ({
    run_id: runId,
    employee_id: r.employee.id,
    employee_name: r.employee.name,
    email: r.employee.email,
    status: r.status,
    subject_found: r.subjectFound ?? null,
    reminder_sent_at: null
  }));

  insertCheckResultsBatch(checkResultRows);

  console.log(`📊 [Checker Service] Check completed. Run ID: ${runId} | Submitted: ${submitted.length} | Missing: ${missing.length}`);

  return {
    runId,
    runDate,
    total: activeEmployees.length,
    submittedCount: submitted.length,
    missingCount: missing.length,
    submitted,
    missing,
    results: checkResultRows.map((r, i) => ({ id: i + 1, ...r }))
  };
}
