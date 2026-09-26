import { getDatabase } from './connection';
import type { CheckRun, CheckResult, SubmissionStatus } from '../types';
import { getTodayDateString } from '../utils/date';

export function insertCheckRun(run: Omit<CheckRun, 'id'>): number {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO check_runs (run_date, run_time, trigger, total, submitted, missing)
    VALUES (@run_date, @run_time, @trigger, @total, @submitted, @missing)
  `);

  const info = stmt.run(run);
  return Number(info.lastInsertRowid);
}

export function insertCheckResult(result: Omit<CheckResult, 'id'>): number {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO check_results (run_id, employee_id, employee_name, email, status, reminder_sent_at, subject_found)
    VALUES (@run_id, @employee_id, @employee_name, @email, @status, @reminder_sent_at, @subject_found)
  `);

  const info = stmt.run({
    ...result,
    reminder_sent_at: result.reminder_sent_at ?? null,
    subject_found: result.subject_found ?? null
  });

  return Number(info.lastInsertRowid);
}

export function insertCheckResultsBatch(results: Omit<CheckResult, 'id'>[]): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO check_results (run_id, employee_id, employee_name, email, status, reminder_sent_at, subject_found)
    VALUES (@run_id, @employee_id, @employee_name, @email, @status, @reminder_sent_at, @subject_found)
  `);

  const insertMany = db.transaction((rows: Omit<CheckResult, 'id'>[]) => {
    for (const row of rows) {
      stmt.run({
        ...row,
        reminder_sent_at: row.reminder_sent_at ?? null,
        subject_found: row.subject_found ?? null
      });
    }
  });

  insertMany(results);
}

export function getRunsByDate(date: string): CheckRun[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM check_runs
    WHERE run_date = ?
    ORDER BY run_time DESC
  `);

  return stmt.all(date) as CheckRun[];
}

export function getResultsByRunId(runId: number): CheckResult[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM check_results
    WHERE run_id = ?
    ORDER BY employee_name ASC
  `);

  return stmt.all(runId) as CheckResult[];
}

export function getRecentRuns(limit: number = 20): CheckRun[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM check_runs
    ORDER BY run_time DESC
    LIMIT ?
  `);

  return stmt.all(limit) as CheckRun[];
}

export function getLatestRun(): CheckRun | null {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM check_runs
    ORDER BY run_time DESC
    LIMIT 1
  `);

  const row = stmt.get();
  return (row as CheckRun) || null;
}

export function getTodayStatus(todayDateStr?: string): { run: CheckRun | null; results: CheckResult[] } {
  const targetDate = todayDateStr || getTodayDateString();
  const db = getDatabase();

  const runStmt = db.prepare(`
    SELECT * FROM check_runs
    WHERE run_date = ?
    ORDER BY run_time DESC
    LIMIT 1
  `);

  const latestTodayRun = runStmt.get(targetDate) as CheckRun | undefined;

  if (!latestTodayRun) {
    return { run: null, results: [] };
  }

  const results = getResultsByRunId(latestTodayRun.id);
  return { run: latestTodayRun, results };
}

export function updateResultStatus(
  resultId: number,
  status: SubmissionStatus,
  reminderSentAt?: string
): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE check_results
    SET status = ?, reminder_sent_at = ?
    WHERE id = ?
  `);

  stmt.run(status, reminderSentAt ?? new Date().toISOString(), resultId);
}

export function updateResultsStatusByRunAndEmployee(
  runId: number,
  employeeId: string,
  status: SubmissionStatus,
  reminderSentAt?: string
): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE check_results
    SET status = ?, reminder_sent_at = ?
    WHERE run_id = ? AND employee_id = ?
  `);

  stmt.run(status, reminderSentAt ?? new Date().toISOString(), runId, employeeId);
}
