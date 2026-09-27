import React, { useState } from 'react';
import { Users, CheckCircle2, BellRing, AlertCircle, Search, Filter, UserPlus } from 'lucide-react';
import { EmployeeCard } from './EmployeeCard';
import { AddEditInternModal } from './AddEditInternModal';
import { ScoreInternModal, type ScoreData } from './ScoreInternModal';
import type { Employee, StatusResponse, SubmissionStatus } from '../types';

interface DashboardProps {
  status: StatusResponse | null;
  employees: Employee[];
  checking: boolean;
  onTriggerCheck: () => void;
  onSendReminder: (runId: number, employeeId: string) => Promise<void>;
  onAddEmployee: (emp: { name: string; email: string; role?: string }) => Promise<void>;
  onUpdateEmployee: (id: string, emp: { name?: string; email?: string; role?: string; active?: boolean }) => Promise<void>;
  onDeleteEmployee: (id: string) => Promise<void>;
  onScoreIntern?: (scoreData: ScoreData) => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  status,
  employees,
  checking,
  onTriggerCheck,
  onSendReminder,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onScoreIntern
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'submitted' | 'reminded' | 'missing'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [scoringEmployee, setScoringEmployee] = useState<Employee | null>(null);
  const [scoringTasks, setScoringTasks] = useState<string>('');

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
        <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-5 shadow-lg shadow-black/40">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">Total Interns</span>
            <div className="p-2.5 rounded-xl bg-zinc-800 text-zinc-300">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{total}</span>
            <span className="text-xs text-zinc-500">Active roster</span>
          </div>
        </div>

        {/* Submitted */}
        <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-5 shadow-lg shadow-black/40">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-400">Submitted Today</span>
            <div className="p-2.5 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-900/50">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{submittedCount}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-800/80">
              {complianceRate}% rate
            </span>
          </div>
        </div>

        {/* Reminded */}
        <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-5 shadow-lg shadow-black/40">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-amber-400">Reminders Sent</span>
            <div className="p-2.5 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-900/50">
              <BellRing className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{remindedCount}</span>
            <span className="text-xs text-zinc-500">Auto notified</span>
          </div>
        </div>

        {/* Pending / Missing */}
        <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-5 shadow-lg shadow-black/40">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-rose-400">Missing Submissions</span>
            <div className="p-2.5 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-900/50">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{missingCount + pendingCount}</span>
            <span className="text-xs text-zinc-500">Need attention</span>
          </div>
        </div>
      </div>

      {/* Latest Run Banner */}
      {status?.latestRun ? (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-300 shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Latest check executed at: <strong className="text-white">{new Date(status.latestRun.run_time).toLocaleTimeString()} ({status.latestRun.run_date})</strong></span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px] uppercase border border-zinc-700">
              {status.latestRun.trigger}
            </span>
          </div>
          <div className="text-zinc-400">
            Run ID #{status.latestRun.id} &bull; <span className="text-emerald-400 font-medium">{status.latestRun.submitted} Submitted</span>, <span className="text-rose-400 font-medium">{status.latestRun.missing} Missing</span>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 text-center">
          <h4 className="font-semibold text-zinc-200 mb-1">
            No check run executed yet today ({status?.date})
          </h4>
          <p className="text-xs text-zinc-400 mb-4 max-w-md mx-auto">
            The system will automatically run at 8:00 PM on weekdays, or you can trigger an instant check right now.
          </p>
          <button
            onClick={onTriggerCheck}
            disabled={checking}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30"
          >
            {checking ? 'Checking Inbox...' : 'Run First Check Now'}
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="intern-search"
            name="internSearch"
            type="text"
            autoComplete="off"
            placeholder="Search intern by name, role, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Controls: Filter Buttons & Add Intern */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-zinc-950 rounded-xl border border-zinc-800 text-xs">
            <span className="px-2 text-zinc-500 flex items-center gap-1">
              <Filter className="w-3 h-3" />
            </span>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/80'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All ({total})
            </button>
            <button
              type="button"
              onClick={() => setFilter('submitted')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                filter === 'submitted'
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm border border-zinc-700/80'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Submitted ({submittedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('reminded')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                filter === 'reminded'
                  ? 'bg-zinc-800 text-amber-400 shadow-sm border border-zinc-700/80'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Reminded ({remindedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('missing')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                filter === 'missing'
                  ? 'bg-zinc-800 text-rose-400 shadow-sm border border-zinc-700/80'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Missing ({missingCount})
            </button>
          </div>

          {/* Add Intern Button */}
          <button
            type="button"
            onClick={() => {
              setEditingEmployee(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/25 transition-all cursor-pointer select-none active:scale-95 shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Intern</span>
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
              onEdit={(targetEmp) => {
                setEditingEmployee(targetEmp);
                setModalOpen(true);
              }}
              onScore={onScoreIntern ? (targetEmp, subject) => {
                setScoringEmployee(targetEmp);
                setScoringTasks(subject || '');
                setScoreModalOpen(true);
              } : undefined}
            />
          );
        })}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12 bg-zinc-900 rounded-2xl border border-zinc-800 p-8">
          <p className="text-zinc-400 text-sm">No interns found matching the selected filter criteria.</p>
        </div>
      )}

      {/* Add / Edit Intern Modal */}
      <AddEditInternModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingEmployee(null);
        }}
        initialEmployee={editingEmployee}
        onSave={async (data) => {
          if (editingEmployee) {
            await onUpdateEmployee(editingEmployee.id, data);
          } else {
            await onAddEmployee(data);
          }
        }}
        onDelete={async (id) => {
          await onDeleteEmployee(id);
        }}
      />

      {/* Score / Evaluate Intern Modal */}
      {onScoreIntern && (
        <ScoreInternModal
          isOpen={scoreModalOpen}
          onClose={() => {
            setScoreModalOpen(false);
            setScoringEmployee(null);
          }}
          employee={scoringEmployee}
          defaultTasks={scoringTasks}
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
