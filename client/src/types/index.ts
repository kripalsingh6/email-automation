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
  run_date: string;
  run_time: string;
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

export interface StatusResponse {
  date: string;
  isWeekday: boolean;
  totalEmployees: number;
  latestRun: CheckRun | null;
  results: CheckResult[];
  gmail: {
    configured: boolean;
    authenticated: boolean;
  };
}

export interface SchedulerStatus {
  isRunning: boolean;
  cronExpression: string;
  nextRunTime: string | null;
  isWeekdayToday: boolean;
}

export * from './performance';
