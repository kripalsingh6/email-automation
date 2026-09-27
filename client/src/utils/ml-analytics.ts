import type { DailyReport, PerformanceMetrics, EmployeeTrend, ClusterResult, PredictionResult } from '../types/performance';

// ============================================================
// Data Aggregation Utilities
// ============================================================

export function computeEmployeeMetrics(reports: DailyReport[]): PerformanceMetrics[] {
  const grouped = new Map<string, DailyReport[]>();
  for (const r of reports) {
    const arr = grouped.get(r.employee_id) || [];
    arr.push(r);
    grouped.set(r.employee_id, arr);
  }

  const metrics: PerformanceMetrics[] = [];
  for (const [empId, empReports] of grouped) {
    const first = empReports[0];
    const avgSelf = mean(empReports.map(r => r.self_rating));
    const avgManager = mean(empReports.map(r => r.manager_rating));
    const completedCount = empReports.filter(r => r.status === 'Completed').length;
    const deadlinesMet = empReports.filter(r => r.deadline_met).length;
    const totalTasks = empReports.reduce((sum, r) => sum + countTasks(r.tasks), 0);
    const avgTasksPerDay = totalTasks / empReports.length;
    const completionRate = (completedCount / empReports.length) * 100;
    const deadlineRate = (deadlinesMet / empReports.length) * 100;

    // Composite performance score (0-100)
    const performanceScore = Math.round(
      avgManager * 5 +      // 50% weight on manager rating (scaled to 50)
      completionRate * 0.2 + // 20% weight on completion rate
      deadlineRate * 0.2 +   // 20% weight on deadline adherence
      avgTasksPerDay * 2.5   // 10% weight on productivity
    );

    metrics.push({
      employee_id: empId,
      name: first.name,
      role: first.role,
      totalReports: empReports.length,
      avgSelfRating: round2(avgSelf),
      avgManagerRating: round2(avgManager),
      completionRate: round2(completionRate),
      deadlineRate: round2(deadlineRate),
      avgTasksPerDay: round2(avgTasksPerDay),
      performanceScore: Math.min(100, performanceScore),
      totalTasks
    });
  }

  return metrics.sort((a, b) => b.performanceScore - a.performanceScore);
}

// ============================================================
// Daily / Weekly / Monthly Trend Aggregation
// ============================================================

export function computeDailyTrends(reports: DailyReport[]): EmployeeTrend[] {
  const byDate = new Map<string, DailyReport[]>();
  for (const r of reports) {
    const arr = byDate.get(r.date) || [];
    arr.push(r);
    byDate.set(r.date, arr);
  }

  const trends: EmployeeTrend[] = [];
  const sortedDates = [...byDate.keys()].sort();

  for (const date of sortedDates) {
    const dayReports = byDate.get(date)!;
    trends.push({
      period: date,
      avgManagerRating: round2(mean(dayReports.map(r => r.manager_rating))),
      avgSelfRating: round2(mean(dayReports.map(r => r.self_rating))),
      completionRate: round2((dayReports.filter(r => r.status === 'Completed').length / dayReports.length) * 100),
      totalTasks: dayReports.reduce((s, r) => s + countTasks(r.tasks), 0),
      reportCount: dayReports.length
    });
  }

  return trends;
}

export function computeWeeklyTrends(reports: DailyReport[]): EmployeeTrend[] {
  const byWeek = new Map<string, DailyReport[]>();
  for (const r of reports) {
    const d = new Date(r.date);
    const weekStart = getMonday(d);
    const key = weekStart.toISOString().slice(0, 10);
    const arr = byWeek.get(key) || [];
    arr.push(r);
    byWeek.set(key, arr);
  }

  const trends: EmployeeTrend[] = [];
  const sortedWeeks = [...byWeek.keys()].sort();

  for (const week of sortedWeeks) {
    const weekReports = byWeek.get(week)!;
    trends.push({
      period: `Wk ${week}`,
      avgManagerRating: round2(mean(weekReports.map(r => r.manager_rating))),
      avgSelfRating: round2(mean(weekReports.map(r => r.self_rating))),
      completionRate: round2((weekReports.filter(r => r.status === 'Completed').length / weekReports.length) * 100),
      totalTasks: weekReports.reduce((s, r) => s + countTasks(r.tasks), 0),
      reportCount: weekReports.length
    });
  }

  return trends;
}

export function computeMonthlyTrends(reports: DailyReport[]): EmployeeTrend[] {
  const byMonth = new Map<string, DailyReport[]>();
  for (const r of reports) {
    const key = r.date.slice(0, 7); // YYYY-MM
    const arr = byMonth.get(key) || [];
    arr.push(r);
    byMonth.set(key, arr);
  }

  const trends: EmployeeTrend[] = [];
  const sortedMonths = [...byMonth.keys()].sort();

  for (const month of sortedMonths) {
    const monthReports = byMonth.get(month)!;
    const monthName = new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    trends.push({
      period: monthName,
      avgManagerRating: round2(mean(monthReports.map(r => r.manager_rating))),
      avgSelfRating: round2(mean(monthReports.map(r => r.self_rating))),
      completionRate: round2((monthReports.filter(r => r.status === 'Completed').length / monthReports.length) * 100),
      totalTasks: monthReports.reduce((s, r) => s + countTasks(r.tasks), 0),
      reportCount: monthReports.length
    });
  }

  return trends;
}

// ============================================================
// Per-Employee Daily Trend (for individual sparklines)
// ============================================================

export function computeEmployeeDailyTrend(reports: DailyReport[], employeeId: string): EmployeeTrend[] {
  const empReports = reports.filter(r => r.employee_id === employeeId).sort((a, b) => a.date.localeCompare(b.date));

  return empReports.map(r => ({
    period: r.date,
    avgManagerRating: r.manager_rating,
    avgSelfRating: r.self_rating,
    completionRate: r.status === 'Completed' ? 100 : 0,
    totalTasks: countTasks(r.tasks),
    reportCount: 1
  }));
}

// ============================================================
// ML: Simple Linear Regression for Performance Trend Prediction
// ============================================================

export function predictPerformanceTrend(trends: EmployeeTrend[]): PredictionResult {
  if (trends.length < 2) {
    return { slope: 0, intercept: 0, predicted: [], trendDirection: 'stable', r2: 0 };
  }

  // Use manager rating over time as the primary signal
  const x = trends.map((_, i) => i);
  const y = trends.map(t => t.avgManagerRating);

  const { slope, intercept } = linearRegression(x, y);

  // Predict next 3 periods
  const n = trends.length;
  const predicted: { period: string; value: number }[] = [];
  for (let i = 0; i < 3; i++) {
    const xi = n + i;
    predicted.push({
      period: `Predicted ${i + 1}`,
      value: round2(Math.max(0, Math.min(10, slope * xi + intercept)))
    });
  }

  // R² calculation
  const yMean = mean(y);
  const ssRes = y.reduce((s, yi, i) => s + (yi - (slope * x[i] + intercept)) ** 2, 0);
  const ssTot = y.reduce((s, yi) => s + (yi - yMean) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : round2(1 - ssRes / ssTot);

  const trendDirection: 'improving' | 'declining' | 'stable' =
    slope > 0.05 ? 'improving' : slope < -0.05 ? 'declining' : 'stable';

  return { slope: round2(slope), intercept: round2(intercept), predicted, trendDirection, r2 };
}

// ============================================================
// ML: K-Means Clustering for Performance Tiers
// ============================================================

export function clusterEmployees(metrics: PerformanceMetrics[], k = 3): ClusterResult[] {
  if (metrics.length < k) {
    return metrics.map(m => ({
      ...m,
      cluster: 0,
      tier: 'Mid Performer' as const
    }));
  }

  // Feature vector: [performanceScore, avgManagerRating * 10, completionRate, deadlineRate]
  const features = metrics.map(m => [
    m.performanceScore,
    m.avgManagerRating * 10,
    m.completionRate,
    m.deadlineRate
  ]);

  // Normalize features
  const mins = features[0].map((_, col) => Math.min(...features.map(f => f[col])));
  const maxs = features[0].map((_, col) => Math.max(...features.map(f => f[col])));
  const normalized = features.map(f =>
    f.map((v, col) => (maxs[col] - mins[col]) === 0 ? 0.5 : (v - mins[col]) / (maxs[col] - mins[col]))
  );

  // Simple K-Means implementation
  const assignments = kMeans(normalized, k, 20);

  // Determine tier labels by average performance score within each cluster
  const clusterAvgs = new Map<number, number>();
  for (let i = 0; i < assignments.length; i++) {
    const cluster = assignments[i];
    const existing = clusterAvgs.get(cluster);
    if (existing !== undefined) {
      clusterAvgs.set(cluster, existing + metrics[i].performanceScore);
    } else {
      clusterAvgs.set(cluster, metrics[i].performanceScore);
    }
  }

  const clusterCounts = new Map<number, number>();
  for (const c of assignments) {
    clusterCounts.set(c, (clusterCounts.get(c) || 0) + 1);
  }

  // Sort clusters by average score to assign tier labels
  const sortedClusters = [...clusterAvgs.entries()]
    .map(([c, total]) => ({ cluster: c, avg: total / (clusterCounts.get(c) || 1) }))
    .sort((a, b) => b.avg - a.avg);

  const tierMap = new Map<number, 'Top Performer' | 'Mid Performer' | 'Needs Improvement'>();
  const tierLabels: ('Top Performer' | 'Mid Performer' | 'Needs Improvement')[] =
    ['Top Performer', 'Mid Performer', 'Needs Improvement'];

  sortedClusters.forEach((sc, i) => {
    tierMap.set(sc.cluster, tierLabels[Math.min(i, tierLabels.length - 1)]);
  });

  return metrics.map((m, i) => ({
    ...m,
    cluster: assignments[i],
    tier: tierMap.get(assignments[i]) || 'Mid Performer'
  }));
}

// ============================================================
// K-Means Implementation (no external dependency)
// ============================================================

function kMeans(data: number[][], k: number, maxIterations: number): number[] {
  const n = data.length;
  const dim = data[0].length;

  // Initialize centroids using K-Means++ style
  const centroids: number[][] = [];
  centroids.push([...data[0]]);

  for (let c = 1; c < k; c++) {
    const distances = data.map(point => {
      const minDist = Math.min(...centroids.map(cent => euclideanDist(point, cent)));
      return minDist * minDist;
    });
    const totalDist = distances.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalDist;
    let chosen = 0;
    for (let i = 0; i < n; i++) {
      random -= distances[i];
      if (random <= 0) { chosen = i; break; }
    }
    centroids.push([...data[chosen]]);
  }

  let assignments = new Array(n).fill(0);

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign each point to nearest centroid
    const newAssignments = data.map(point => {
      let minDist = Infinity;
      let closest = 0;
      for (let c = 0; c < k; c++) {
        const dist = euclideanDist(point, centroids[c]);
        if (dist < minDist) {
          minDist = dist;
          closest = c;
        }
      }
      return closest;
    });

    // Check convergence
    const changed = newAssignments.some((a, i) => a !== assignments[i]);
    assignments = newAssignments;

    if (!changed) break;

    // Update centroids
    for (let c = 0; c < k; c++) {
      const members = data.filter((_, i) => assignments[i] === c);
      if (members.length === 0) continue;

      for (let d = 0; d < dim; d++) {
        centroids[c][d] = mean(members.map(m => m[d]));
      }
    }
  }

  return assignments;
}

// ============================================================
// Category distribution for radar chart
// ============================================================

export function computeCategoryDistribution(reports: DailyReport[]) {
  const counts = new Map<string, number>();
  for (const r of reports) {
    counts.set(r.category, (counts.get(r.category) || 0) + 1);
  }
  return [...counts.entries()].map(([category, count]) => ({ category, count }));
}

export function computeSeverityDistribution(reports: DailyReport[]) {
  const counts = new Map<string, number>();
  for (const r of reports) {
    counts.set(r.severity, (counts.get(r.severity) || 0) + 1);
  }
  return [...counts.entries()].map(([severity, count]) => ({ severity, count }));
}

// ============================================================
// Helper Utilities
// ============================================================

function mean(arr: number[]): number {
  return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function countTasks(taskStr: string): number {
  return taskStr.split('\n').filter(l => l.trim().length > 0).length;
}

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function euclideanDist(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, ai, i) => sum + (ai - b[i]) ** 2, 0));
}

function linearRegression(x: number[], y: number[]): { slope: number; intercept: number } {
  const n = x.length;
  const xMean = mean(x);
  const yMean = mean(y);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - xMean) * (y[i] - yMean);
    den += (x[i] - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;
  return { slope, intercept };
}
