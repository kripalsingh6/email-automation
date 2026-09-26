import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import type { Employee, CheckResult, CheckExecutionResult } from '../types';
import { getTodayDateString } from '../utils/date';
import { buildGmailQuery, matchesExpectedSubject } from '../utils/parser';
import { searchEmails } from './gmail.service';
import { insertCheckRun, insertCheckResultsBatch } from '../db/queries';

export function loadEmployees(): Employee[] {
  let filePath = env.EMPLOYEES_FILE;
  if (!fs.existsSync(filePath)) {
    // Fallback if named employess.json
    const altPath = path.resolve(path.dirname(filePath), 'employess.json');
    if (fs.existsSync(altPath)) {
      filePath = altPath;
    } else {
      throw new Error(`Employees file not found at ${env.EMPLOYEES_FILE}`);
    }
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const employees: Employee[] = JSON.parse(raw);
  return employees.filter(emp => emp.active);
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

  const activeEmployees = loadEmployees();
  console.log(`🔍 [Checker Service] Starting ${trigger} check for ${activeEmployees.length} active employees on ${runDate}...`);

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
          status: 'submitted' as const,
          subjectFound: matchedEmail.subject
        };
      } else {
        return {
          employee: emp,
          status: 'missing' as const,
          subjectFound: undefined
        };
      }
    } catch (err) {
      console.error(`⚠️ Error checking email for ${emp.name}:`, err);
      return {
        employee: emp,
        status: 'missing' as const,
        subjectFound: undefined
      };
    }
  });

  const submitted = employeeResults.filter(r => r.status === 'submitted').map(r => r.employee);
  const missing = employeeResults.filter(r => r.status === 'missing').map(r => r.employee);

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
