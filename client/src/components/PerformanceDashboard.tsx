import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
  TrendingUp, TrendingDown, Minus, BarChart3, Activity,
  Users, Target, Award, Brain, Layers, Calendar, Star
} from 'lucide-react';
import type { DailyReport, ClusterResult, Employee } from '../types';
import { ScoreInternModal, type ScoreData } from './ScoreInternModal';
import {
  computeEmployeeMetrics,
  computeDailyTrends,
  computeWeeklyTrends,
  computeMonthlyTrends,
  predictPerformanceTrend,
  clusterEmployees,
  computeCategoryDistribution,
  computeSeverityDistribution,
  computeEmployeeDailyTrend
} from '../utils/ml-analytics';

// Register Chart.js components
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, RadialLinearScale,
  Title, Tooltip, Legend, Filler
);

// Color palette for employee lines
const EMPLOYEE_COLORS = [
  { bg: 'rgba(99, 102, 241, 0.2)', border: '#6366f1' },  // Indigo
  { bg: 'rgba(16, 185, 129, 0.2)', border: '#10b981' },   // Emerald
  { bg: 'rgba(245, 158, 11, 0.2)', border: '#f59e0b' },   // Amber
  { bg: 'rgba(239, 68, 68, 0.2)', border: '#ef4444' },     // Red
  { bg: 'rgba(59, 130, 246, 0.2)', border: '#3b82f6' },    // Blue
  { bg: 'rgba(168, 85, 247, 0.2)', border: '#a855f7' },    // Purple
];

const TIER_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'Top Performer': { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', text: '#10b981' },
  'Mid Performer': { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#f59e0b' },
  'Needs Improvement': { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#ef4444' },
};

interface PerformanceDashboardProps {
  reports: DailyReport[];
  employees?: Employee[];
  onScoreIntern?: (scoreData: ScoreData) => Promise<void>;
}

type TimeRange = 'daily' | 'weekly' | 'monthly';

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  reports,
  employees = [],
  onScoreIntern
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');
  const [selectedEmployee, setSelectedEmployee] = useState<string | 'all'>('all');
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [scoringEmployee, setScoringEmployee] = useState<Employee | null>(null);

  // Computed data
  const metrics = useMemo(() => computeEmployeeMetrics(reports), [reports]);
  const clustered = useMemo(() => clusterEmployees(metrics, 3), [metrics]);
  const categoryDist = useMemo(() => computeCategoryDistribution(reports), [reports]);
  const severityDist = useMemo(() => computeSeverityDistribution(reports), [reports]);

  const trends = useMemo(() => {
    switch (timeRange) {
      case 'daily': return computeDailyTrends(reports);
      case 'weekly': return computeWeeklyTrends(reports);
      case 'monthly': return computeMonthlyTrends(reports);
    }
  }, [reports, timeRange]);

  const prediction = useMemo(() => predictPerformanceTrend(trends), [trends]);

  // Per-employee trends for comparison chart
  const employeeIds = useMemo(() => [...new Set(reports.map(r => r.employee_id))], [reports]);
  const employeeTrends = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeEmployeeDailyTrend>>();
    for (const empId of employeeIds) {
      map.set(empId, computeEmployeeDailyTrend(reports, empId));
    }
    return map;
  }, [reports, employeeIds]);

  // Summary stats
  const totalReports = reports.length;
  const avgRating = metrics.length > 0
    ? (metrics.reduce((s, m) => s + m.avgManagerRating, 0) / metrics.length).toFixed(1)
    : '0';
  const avgCompletion = metrics.length > 0
    ? (metrics.reduce((s, m) => s + m.completionRate, 0) / metrics.length).toFixed(0)
    : '0';
  const avgDeadline = metrics.length > 0
    ? (metrics.reduce((s, m) => s + m.deadlineRate, 0) / metrics.length).toFixed(0)
    : '0';

  // Chart Options
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#a1a1aa',
          font: { size: 11, family: 'Inter, system-ui, sans-serif' },
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 8
        }
      },
      tooltip: {
        backgroundColor: 'rgba(9, 9, 11, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#e4e4e7',
        borderColor: 'rgba(255, 255, 255, 0.12)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 13, family: 'Inter, system-ui, sans-serif', weight: 'bold' as const },
        bodyFont: { size: 12, family: 'Inter, system-ui, sans-serif' }
      }
    },
    scales: {
      x: {
        ticks: { color: '#71717a', font: { size: 10, family: 'Inter, system-ui, sans-serif' } },
        grid: { color: 'rgba(255, 255, 255, 0.06)' }
      },
      y: {
        ticks: { color: '#71717a', font: { size: 10, family: 'Inter, system-ui, sans-serif' } },
        grid: { color: 'rgba(255, 255, 255, 0.06)' }
      }
    }
  };

  // ─── Performance Trend Chart Data ───
  const trendChartData = {
    labels: [
      ...trends.map(t => t.period.length > 10 ? t.period.slice(5) : t.period),
      ...prediction.predicted.map(p => p.period)
    ],
    datasets: [
      {
        label: 'Manager Rating',
        data: [...trends.map(t => t.avgManagerRating), ...prediction.predicted.map(p => p.value)],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: [...trends.map(() => 4), ...prediction.predicted.map(() => 6)],
        pointBackgroundColor: [...trends.map(() => '#6366f1'), ...prediction.predicted.map(() => '#a855f7')],
        pointBorderColor: [...trends.map(() => '#6366f1'), ...prediction.predicted.map(() => '#a855f7')],
        pointStyle: [...trends.map((): string => 'circle'), ...prediction.predicted.map((): string => 'triangle')],
        borderDash: [...trends.map(() => 0), ...prediction.predicted.map(() => 5)],
        segment: {
          borderDash: (ctx: { p0DataIndex: number }) => ctx.p0DataIndex >= trends.length - 1 ? [6, 3] : undefined
        }
      },
      {
        label: 'Self Rating',
        data: [...trends.map(t => t.avgSelfRating), ...new Array(prediction.predicted.length).fill(null)],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#10b981'
      }
    ]
  };

  // ─── Completion Rate Bar Chart ───
  const completionChartData = {
    labels: trends.map(t => t.period.length > 10 ? t.period.slice(5) : t.period),
    datasets: [
      {
        label: 'Completion Rate %',
        data: trends.map(t => t.completionRate),
        backgroundColor: trends.map(t =>
          t.completionRate >= 90 ? 'rgba(16, 185, 129, 0.7)' :
          t.completionRate >= 70 ? 'rgba(245, 158, 11, 0.7)' :
          'rgba(239, 68, 68, 0.7)'
        ),
        borderColor: trends.map(t =>
          t.completionRate >= 90 ? '#10b981' :
          t.completionRate >= 70 ? '#f59e0b' :
          '#ef4444'
        ),
        borderWidth: 1,
        borderRadius: 6
      },
      {
        label: 'Tasks Count',
        data: trends.map(t => t.totalTasks),
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        borderColor: '#6366f1',
        borderWidth: 1,
        borderRadius: 6,
        yAxisID: 'y1'
      }
    ]
  };

  const completionOptions = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      y: { ...commonOptions.scales.y, beginAtZero: true, max: 110, title: { display: true, text: 'Completion %', color: '#94a3b8' } },
      y1: {
        position: 'right' as const,
        beginAtZero: true,
        ticks: { color: '#94a3b8', font: { size: 10, family: 'Inter, system-ui, sans-serif' } },
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'Task Count', color: '#94a3b8' }
      }
    }
  };

  // ─── Employee Comparison Chart (individual rating trends) ───
  const employeeComparisonData = {
    labels: computeDailyTrends(reports).map(t => t.period.slice(5)),
    datasets: selectedEmployee === 'all'
      ? employeeIds.map((empId, i) => {
          const name = metrics.find(m => m.employee_id === empId)?.name || empId;
          const empTrend = employeeTrends.get(empId) || [];
          return {
            label: name.split(' ')[0],
            data: empTrend.map(t => t.avgManagerRating),
            borderColor: EMPLOYEE_COLORS[i % EMPLOYEE_COLORS.length].border,
            backgroundColor: EMPLOYEE_COLORS[i % EMPLOYEE_COLORS.length].bg,
            tension: 0.4,
            pointRadius: 3,
            borderWidth: 2
          };
        })
      : (() => {
          const empTrend = employeeTrends.get(selectedEmployee) || [];
          const i = employeeIds.indexOf(selectedEmployee);
          const name = metrics.find(m => m.employee_id === selectedEmployee)?.name || selectedEmployee;
          return [{
            label: `${name} - Manager Rating`,
            data: empTrend.map(t => t.avgManagerRating),
            borderColor: EMPLOYEE_COLORS[i % EMPLOYEE_COLORS.length].border,
            backgroundColor: EMPLOYEE_COLORS[i % EMPLOYEE_COLORS.length].bg,
            fill: true,
            tension: 0.4,
            pointRadius: 4
          }, {
            label: `${name} - Self Rating`,
            data: empTrend.map(t => t.avgSelfRating),
            borderColor: '#94a3b8',
            backgroundColor: 'rgba(148, 163, 184, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            borderDash: [4, 4]
          }];
        })()
  };

  // ─── Category Distribution Doughnut ───
  const categoryColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7', '#ec4899'];
  const categoryChartData = {
    labels: categoryDist.map(c => c.category),
    datasets: [{
      data: categoryDist.map(c => c.count),
      backgroundColor: categoryDist.map((_, i) => categoryColors[i % categoryColors.length] + '33'),
      borderColor: categoryDist.map((_, i) => categoryColors[i % categoryColors.length]),
      borderWidth: 2,
      hoverOffset: 8
    }]
  };

  // ─── Severity Distribution Doughnut ───
  const severityColors: Record<string, string> = {
    'Critical': '#ef4444', 'High': '#f59e0b', 'Medium': '#3b82f6', 'Low': '#10b981'
  };
  const severityChartData = {
    labels: severityDist.map(s => s.severity),
    datasets: [{
      data: severityDist.map(s => s.count),
      backgroundColor: severityDist.map(s => (severityColors[s.severity] || '#94a3b8') + '33'),
      borderColor: severityDist.map(s => severityColors[s.severity] || '#94a3b8'),
      borderWidth: 2,
      hoverOffset: 8
    }]
  };

  // ─── Employee Performance Radar Chart ───
  const radarData = {
    labels: ['Avg Rating', 'Completion %', 'Deadline %', 'Tasks/Day', 'Score'],
    datasets: clustered.slice(0, 6).map((emp, i) => ({
      label: emp.name.split(' ')[0],
      data: [
        emp.avgManagerRating * 10,
        emp.completionRate,
        emp.deadlineRate,
        emp.avgTasksPerDay * 20,
        emp.performanceScore
      ],
      borderColor: EMPLOYEE_COLORS[i % EMPLOYEE_COLORS.length].border,
      backgroundColor: EMPLOYEE_COLORS[i % EMPLOYEE_COLORS.length].bg,
      borderWidth: 2,
      pointRadius: 3
    }))
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        ticks: { color: '#71717a', backdropColor: 'transparent', font: { size: 9 } },
        grid: { color: 'rgba(255, 255, 255, 0.08)' },
        angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
        pointLabels: { color: '#a1a1aa', font: { size: 10, family: 'Inter, system-ui, sans-serif' } },
        beginAtZero: true,
        max: 100
      }
    },
    plugins: {
      legend: commonOptions.plugins.legend,
      tooltip: commonOptions.plugins.tooltip
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { ...commonOptions.plugins.legend.labels, padding: 12 }
      },
      tooltip: commonOptions.plugins.tooltip
    }
  };

  // Trend direction icon
  const TrendIcon = prediction.trendDirection === 'improving'
    ? TrendingUp
    : prediction.trendDirection === 'declining'
      ? TrendingDown
      : Minus;

  const trendColor = prediction.trendDirection === 'improving'
    ? 'text-emerald-400'
    : prediction.trendDirection === 'declining'
      ? 'text-rose-400'
      : 'text-amber-400';

  return (
    <div className="space-y-8">
      {/* ═══ KPI Summary Cards ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-5 shadow-lg shadow-black/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Reports</span>
            <div className="p-2 rounded-xl bg-zinc-800 text-indigo-400">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{totalReports}</span>
            <span className="text-xs text-zinc-500">entries</span>
          </div>
        </div>

        <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-5 shadow-lg shadow-black/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Avg Manager Rating</span>
            <div className="p-2 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-900/50">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{avgRating}</span>
            <span className="text-xs text-zinc-500">/ 10</span>
          </div>
        </div>

        <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-5 shadow-lg shadow-black/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Completion Rate</span>
            <div className="p-2 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-900/50">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{avgCompletion}%</span>
          </div>
        </div>

        <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-5 shadow-lg shadow-black/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Deadline Adherence</span>
            <div className="p-2 rounded-xl bg-blue-950/60 text-blue-400 border border-blue-900/50">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{avgDeadline}%</span>
          </div>
        </div>
      </div>

      {/* ═══ ML Insights Banner ═══ */}
      <div className="bg-gradient-to-r from-indigo-950/70 via-purple-950/50 to-zinc-900 border border-indigo-800/60 rounded-2xl p-5 shadow-lg shadow-black/40">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-indigo-900/60 border border-indigo-700/50">
            <Brain className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="font-semibold text-white">ML Performance Insights</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <TrendIcon className={`w-5 h-5 ${trendColor}`} />
            <div>
              <p className="text-xs text-zinc-400">Trend Direction</p>
              <p className={`text-sm font-semibold capitalize ${trendColor}`}>{prediction.trendDirection}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <Activity className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-xs text-zinc-400">Regression R²</p>
              <p className="text-sm font-semibold text-white">{prediction.r2.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <Layers className="w-5 h-5 text-pink-400" />
            <div>
              <p className="text-xs text-zinc-400">Performance Clusters</p>
              <p className="text-sm font-semibold text-white">{new Set(clustered.map(c => c.tier)).size} Tiers Identified</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Time Range Toggle ═══ */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800 text-xs w-fit">
        {(['daily', 'weekly', 'monthly'] as TimeRange[]).map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-1.5 rounded-lg font-medium transition-all capitalize ${
              timeRange === range
                ? 'bg-zinc-800 text-indigo-400 shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* ═══ Charts Row 1: Trend + Completion ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-5 shadow-lg shadow-black/40">
          <h4 className="text-sm font-semibold text-white mb-1">Rating Trends & Predictions</h4>
          <p className="text-xs text-zinc-400 mb-4">
            Linear regression prediction shown with dashed line (R² = {prediction.r2.toFixed(2)})
          </p>
          <div className="h-72">
            <Line data={trendChartData} options={commonOptions} />
          </div>
        </div>

        <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-5 shadow-lg shadow-black/40">
          <h4 className="text-sm font-semibold text-white mb-1">Completion Rate & Task Volume</h4>
          <p className="text-xs text-zinc-400 mb-4">Green = ≥90%, Amber = ≥70%, Red = &lt;70%</p>
          <div className="h-72">
            <Bar data={completionChartData} options={completionOptions} />
          </div>
        </div>
      </div>

      {/* ═══ Charts Row 2: Employee Comparison + Radar ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-5 shadow-lg shadow-black/40">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-white">Employee Comparison</h4>
              <p className="text-xs text-zinc-400 mt-0.5">Individual rating trajectories over time</p>
            </div>
            <select
              id="employee-filter"
              name="employeeFilter"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="all">All Employees</option>
              {metrics.map(m => (
                <option key={m.employee_id} value={m.employee_id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="h-72">
            <Line data={employeeComparisonData} options={commonOptions} />
          </div>
        </div>

        <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-5 shadow-lg shadow-black/40">
          <h4 className="text-sm font-semibold text-white mb-1">Performance Radar</h4>
          <p className="text-xs text-zinc-400 mb-4">Multi-dimensional comparison across all metrics</p>
          <div className="h-72">
            <Radar data={radarData} options={radarOptions} />
          </div>
        </div>
      </div>

      {/* ═══ Charts Row 3: Category + Severity Distributions ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-5 shadow-lg shadow-black/40">
          <h4 className="text-sm font-semibold text-white mb-1">Work Category Distribution</h4>
          <p className="text-xs text-zinc-400 mb-4">Task categories across all reports</p>
          <div className="h-56 flex items-center justify-center">
            <Doughnut data={categoryChartData} options={doughnutOptions} />
          </div>
        </div>

        <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-5 shadow-lg shadow-black/40">
          <h4 className="text-sm font-semibold text-white mb-1">Task Severity Distribution</h4>
          <p className="text-xs text-zinc-400 mb-4">Priority levels across all tasks</p>
          <div className="h-56 flex items-center justify-center">
            <Doughnut data={severityChartData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* ═══ ML: Employee Performance Tiers (Clustering) ═══ */}
      <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-5 shadow-lg shadow-black/40">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-purple-950/70 border border-purple-800/60">
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Employee Performance Tiers</h4>
            <p className="text-xs text-zinc-400">K-Means clustering based on composite metrics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clustered.map((emp, i) => (
            <EmployeeTierCard key={emp.employee_id} employee={emp} index={i} />
          ))}
        </div>
      </div>

      {/* ═══ Detailed Leaderboard Table ═══ */}
      <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 shadow-xl shadow-black/50 overflow-hidden">
        <div className="p-5 border-b border-zinc-800">
          <h4 className="text-sm font-semibold text-white">Performance Leaderboard</h4>
          <p className="text-xs text-zinc-400 mt-0.5">Ranked by composite performance score</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">#</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Employee</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Score</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Mgr Rating</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Completion</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Deadlines</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Tasks/Day</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Tier</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {clustered.map((emp, i) => {
                const tierStyle = TIER_COLORS[emp.tier] || TIER_COLORS['Mid Performer'];
                return (
                  <tr key={emp.employee_id} className="border-t border-zinc-800/80 hover:bg-zinc-800/40 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-bold text-zinc-500">{i + 1}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm" style={{ backgroundColor: EMPLOYEE_COLORS[i % EMPLOYEE_COLORS.length].border }}>
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{emp.name}</p>
                          <p className="text-xs text-zinc-400">{emp.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${emp.performanceScore}%` }} />
                        </div>
                        <span className="text-sm font-semibold text-white">{emp.performanceScore}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-zinc-300">{emp.avgManagerRating}/10</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-300">{emp.completionRate}%</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-300">{emp.deadlineRate}%</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-300">{emp.avgTasksPerDay}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: tierStyle.bg, color: tierStyle.text, border: `1px solid ${tierStyle.border}33` }}>
                        {emp.tier}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {onScoreIntern && (
                        <button
                          type="button"
                          onClick={() => {
                            const empObj: Employee = employees.find(e => e.id === emp.employee_id) || {
                              id: emp.employee_id,
                              name: emp.name,
                              email: '',
                              role: emp.role,
                              active: true
                            };
                            setScoringEmployee(empObj);
                            setScoreModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all cursor-pointer select-none active:scale-95"
                          title="Evaluate and give manager rating (1-10)"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>Rate</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Score Intern Modal */}
      {onScoreIntern && (
        <ScoreInternModal
          isOpen={scoreModalOpen}
          onClose={() => {
            setScoreModalOpen(false);
            setScoringEmployee(null);
          }}
          employee={scoringEmployee}
          onSaveScore={async (scoreData) => {
            await onScoreIntern(scoreData);
            setScoreModalOpen(false);
            setScoringEmployee(null);
          }}
        />
      )}
    </div>
  );
};

// ─── Employee Tier Card Sub-Component ───
const EmployeeTierCard: React.FC<{ employee: ClusterResult; index: number }> = ({ employee, index }) => {
  const tierStyle = TIER_COLORS[employee.tier] || TIER_COLORS['Mid Performer'];

  return (
    <div className="p-4 rounded-xl border transition-all hover:shadow-lg hover:shadow-black/40" style={{ borderColor: tierStyle.border + '40', backgroundColor: tierStyle.bg }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm" style={{ backgroundColor: EMPLOYEE_COLORS[index % EMPLOYEE_COLORS.length].border }}>
          {employee.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{employee.name}</p>
          <p className="text-xs text-zinc-400 truncate">{employee.role}</p>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide" style={{ color: tierStyle.text, border: `1px solid ${tierStyle.border}` }}>
          {employee.tier}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded-lg bg-zinc-950/80 border border-zinc-800/60">
          <span className="text-zinc-400 block">Score</span>
          <span className="font-bold text-white">{employee.performanceScore}/100</span>
        </div>
        <div className="p-2 rounded-lg bg-zinc-950/80 border border-zinc-800/60">
          <span className="text-zinc-400 block">Rating</span>
          <span className="font-bold text-white">{employee.avgManagerRating}/10</span>
        </div>
        <div className="p-2 rounded-lg bg-zinc-950/80 border border-zinc-800/60">
          <span className="text-zinc-400 block">Completion</span>
          <span className="font-bold text-white">{employee.completionRate}%</span>
        </div>
        <div className="p-2 rounded-lg bg-zinc-950/80 border border-zinc-800/60">
          <span className="text-zinc-400 block">Tasks/Day</span>
          <span className="font-bold text-white">{employee.avgTasksPerDay}</span>
        </div>
      </div>
    </div>
  );
};
