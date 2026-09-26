import React from 'react';
import { Mail, Briefcase, Send, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import type { Employee, SubmissionStatus } from '../types';

interface EmployeeCardProps {
  employee: Employee;
  status: SubmissionStatus;
  subjectFound?: string | null;
  reminderSentAt?: string | null;
  runId?: number | null;
  onSendReminder: (runId: number, employeeId: string) => Promise<void>;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  status,
  subjectFound,
  reminderSentAt,
  runId,
  onSendReminder
}) => {
  const [reminding, setReminding] = React.useState(false);

  // Generate colorful avatar initials
  const initials = employee.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleRemindClick = async () => {
    if (!runId) return;
    try {
      setReminding(true);
      await onSendReminder(runId, employee.id);
    } finally {
      setReminding(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Top row: Avatar & Status Badge */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {initials}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base leading-snug">
                {employee.name}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>{employee.role}</span>
              </div>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Email Address */}
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-800 mb-3">
          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{employee.email}</span>
        </div>

        {/* Dynamic Detail Section */}
        {status === 'submitted' && subjectFound && (
          <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-lg p-2.5 text-xs text-emerald-800 dark:text-emerald-300">
            <span className="font-semibold block mb-0.5">Email Received:</span>
            <span className="font-mono text-[11px] block truncate" title={subjectFound}>
              {subjectFound}
            </span>
          </div>
        )}

        {status === 'reminded' && reminderSentAt && (
          <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-lg p-2.5 text-xs text-amber-800 dark:text-amber-300">
            <span className="font-semibold block mb-0.5">Reminder Dispatched:</span>
            <span className="text-[11px]">
              {new Date(reminderSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(reminderSentAt).toLocaleDateString()})
            </span>
          </div>
        )}

        {status === 'missing' && (
          <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-lg p-2.5 text-xs text-rose-800 dark:text-rose-300">
            No daily update email received for today yet.
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-mono">
          ID: {employee.id}
        </span>

        {status !== 'submitted' && runId && (
          <button
            onClick={handleRemindClick}
            disabled={reminding}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 transition-colors disabled:opacity-50"
          >
            <Send className="w-3 h-3" />
            <span>{reminding ? 'Sending...' : 'Send Reminder'}</span>
          </button>
        )}

        {status === 'submitted' && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified
          </span>
        )}
      </div>
    </div>
  );
};
