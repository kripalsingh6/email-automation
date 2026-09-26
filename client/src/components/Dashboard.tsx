import React, { useState } from 'react';
import { Users, CheckCircle2, BellRing, AlertCircle, Search, Filter } from 'lucide-react';
import { EmployeeCard } from './EmployeeCard';
import type { Employee, StatusResponse, SubmissionStatus } from '../types';

interface DashboardProps {
  status: StatusResponse | null;
  employees: Employee[];
  checking: boolean;
  onTriggerCheck: () => void;
  onSendReminder: (runId: number, employeeId: string) => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  status,
  employees,
  checking,
  onTriggerCheck,
  onSendReminder
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'submitted' | 'reminded' | 'missing'>('all');

  // Map employee ID to their latest today result
  const resultsMap = new Map<string, { status: SubmissionStatus; subjectFound?: string | null; reminderSentAt?: string | null }>();

  if (status?.results) {
    for (const res of status.results) {
      resultsMap.set(res.employee_id, {
        status: res.status,
        subjectFound: res.subject_found,
        reminderSentAt: res.reminder_sent_at
      });
    }
  }

  // Calculate metrics
  const total = employees.length;
  const submittedCount = Array.from(resultsMap.values()).filter(r => r.status === 'submitted').length;
  const remindedCount = Array.from(resultsMap.values()).filter(r => r.status === 'reminded').length;
  const missingCount = Array.from(resultsMap.values()).filter(r => r.status === 'missing').length;
  const pendingCount = total - (submittedCount + remindedCount + missingCount);

  const complianceRate = total > 0 ? Math.round((submittedCount / total) * 100) : 0;

  // Filtered list
  const filteredEmployees = employees.filter(emp => {
    const res = resultsMap.get(emp.id);
    const empStatus = res ? res.status : 'pending';

    // Status filter
    if (filter !== 'all' && empStatus !== filter) {
      return false;
    }

    // Text search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      return emp.name.toLowerCase().includes(q) || emp.role.toLowerCase().includes(q) || emp.email.toLowerCase().includes(q);
    }

    return true;
  });

  return (
    <div className="space-y-8">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Interns */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Interns</span>
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{total}</span>
            <span className="text-xs text-slate-500">Active roster</span>
          </div>
        </div>

        {/* Submitted */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Submitted Today</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{submittedCount}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              {complianceRate}% rate
            </span>
          </div>
        </div>

        {/* Reminded */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Reminders Sent</span>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <BellRing className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{remindedCount}</span>
            <span className="text-xs text-slate-500">Auto notified</span>
          </div>
        </div>

        {/* Pending / Missing */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-rose-600 dark:text-rose-400">Missing Submissions</span>
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{missingCount + pendingCount}</span>
            <span className="text-xs text-slate-500">Need attention</span>
          </div>
        </div>
      </div>

      {/* Latest Run Banner */}
      {status?.latestRun ? (
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Latest check executed at: <strong>{new Date(status.latestRun.run_time).toLocaleTimeString()} ({status.latestRun.run_date})</strong></span>
            <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] uppercase">
              {status.latestRun.trigger}
            </span>
          </div>
          <div>
            Run ID #{status.latestRun.id} &bull; {status.latestRun.submitted} Submitted, {status.latestRun.missing} Missing
          </div>
        </div>
      ) : (
        <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-6 text-center">
          <h4 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-1">
            No check run executed yet today ({status?.date})
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-md mx-auto">
            The system will automatically run at 8:00 PM on weekdays, or you can trigger an instant check right now.
          </p>
          <button
            onClick={onTriggerCheck}
            disabled={checking}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
          >
            {checking ? 'Checking Inbox...' : 'Run First Check Now'}
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="intern-search"
            name="internSearch"
            type="text"
            autoComplete="off"
            placeholder="Search intern by name, role, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <span className="px-2 text-slate-400 flex items-center gap-1">
            <Filter className="w-3 h-3" />
          </span>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All ({total})
          </button>
          <button
            onClick={() => setFilter('submitted')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === 'submitted'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Submitted ({submittedCount})
          </button>
          <button
            onClick={() => setFilter('reminded')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === 'reminded'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Reminded ({remindedCount})
          </button>
          <button
            onClick={() => setFilter('missing')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === 'missing'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Missing ({missingCount})
          </button>
        </div>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map(emp => {
          const res = resultsMap.get(emp.id);
          const empStatus: SubmissionStatus = res ? res.status : 'pending';

          return (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              status={empStatus}
              subjectFound={res?.subjectFound}
              reminderSentAt={res?.reminderSentAt}
              runId={status?.latestRun?.id}
              onSendReminder={onSendReminder}
            />
          );
        })}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
          <p className="text-slate-500 text-sm">No interns found matching the selected filter criteria.</p>
        </div>
      )}
    </div>
  );
};
