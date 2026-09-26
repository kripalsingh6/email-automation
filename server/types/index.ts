export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

export type SubmissionStatus = 'submitted' | 'missing' | 'reminded' | 'pending';

export interface CheckRun {
  id: number;
  run_date: string; // YYYY-MM-DD
  run_time: string; // ISO timestamp
  trigger: 'scheduled' | 'manual';
  total: number;
  submitted: number;
  missing: number;
}

export interface CheckResult {
  id: number;
  run_id: number;
  employee_id: string;
  employee_name: string;
  email: string;
  status: SubmissionStatus;
  reminder_sent_at?: string | null;
  subject_found?: string | null;
}

export interface CheckExecutionResult {
  runId: number;
  runDate: string;
  total: number;
  submittedCount: number;
  missingCount: number;
  submitted: Employee[];
  missing: Employee[];
  results: CheckResult[];
}

export interface SchedulerStatusResponse {
  isRunning: boolean;
  cronExpression: string;
  nextRunTime: string | null;
  isWeekdayToday: boolean;
}
