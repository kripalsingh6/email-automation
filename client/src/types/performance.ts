export interface DailyReport {
  date: string;
  employee_id: string;
  name: string;
  role: string;
  tasks: string;
  tomorrows_tasks: string;
  category: string;
  status: 'Completed' | 'In Progress' | 'Blocked' | 'Not Started';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  self_rating: number;
  manager_rating: number;
  deadline_met: boolean;
  link: string;
}

export interface PerformanceMetrics {
  employee_id: string;
  name: string;
  role: string;
  totalReports: number;
  avgSelfRating: number;
  avgManagerRating: number;
  completionRate: number;
  deadlineRate: number;
  avgTasksPerDay: number;
  performanceScore: number;
  totalTasks: number;
}

export interface EmployeeTrend {
  period: string;
  avgManagerRating: number;
  avgSelfRating: number;
  completionRate: number;
  totalTasks: number;
  reportCount: number;
}

export interface ClusterResult extends PerformanceMetrics {
  cluster: number;
  tier: 'Top Performer' | 'Mid Performer' | 'Needs Improvement';
}

export interface PredictionResult {
  slope: number;
  intercept: number;
  predicted: { period: string; value: number }[];
  trendDirection: 'improving' | 'declining' | 'stable';
  r2: number;
}
