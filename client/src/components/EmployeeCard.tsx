import React from 'react';
import { Mail, Briefcase, Send, CheckCircle2, Pencil, Star } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import type { Employee, SubmissionStatus } from '../types';

interface EmployeeCardProps {
  employee: Employee;
  status: SubmissionStatus;
  subjectFound?: string | null;
  reminderSentAt?: string | null;
  runId?: number | null;
  onSendReminder: (runId: number, employeeId: string) => Promise<void>;
  onEdit?: (employee: Employee) => void;
  onScore?: (employee: Employee, subjectFound?: string | null) => void;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  status,
  subjectFound,
  reminderSentAt,
  runId,
  onSendReminder,
  onEdit,
  onScore
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
    <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 hover:border-zinc-700/80 p-5 shadow-lg shadow-black/40 hover:shadow-black/60 transition-all flex flex-col justify-between group">
      <div>
        {/* Top row: Avatar & Status Badge */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20">
              {initials}
            </div>
            <div>
              <h3 className="font-semibold text-white text-base leading-snug">
                {employee.name}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                <Briefcase className="w-3.5 h-3.5 text-zinc-500" />
                <span>{employee.role}</span>
              </div>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Email Address */}
        <div className="flex items-center justify-between text-xs text-zinc-300 bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-800/80 mb-3 group/mail">
          <div className="flex items-center gap-2 truncate min-w-0">
            <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="truncate">{employee.email}</span>
          </div>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(employee)}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-indigo-400 transition-colors cursor-pointer shrink-0 ml-1"
              title="Edit intern details / Gmail address"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dynamic Detail Section */}
        {status === 'submitted' && subjectFound && (
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-lg p-2.5 text-xs text-emerald-300">
            <span className="font-semibold block mb-0.5 text-emerald-400">Email Received:</span>
            <span className="font-mono text-[11px] block truncate" title={subjectFound}>
              {subjectFound}
            </span>
          </div>
        )}

        {status === 'reminded' && reminderSentAt && (
          <div className="bg-amber-950/40 border border-amber-800/60 rounded-lg p-2.5 text-xs text-amber-300">
            <span className="font-semibold block mb-0.5 text-amber-400">Reminder Dispatched:</span>
            <span className="text-[11px]">
              {new Date(reminderSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(reminderSentAt).toLocaleDateString()})
            </span>
          </div>
        )}

        {status === 'missing' && (
          <div className="bg-rose-950/40 border border-rose-800/60 rounded-lg p-2.5 text-xs text-rose-300">
            No daily update received by 8:00 PM deadline.
          </div>
        )}

        {status === 'pending' && (
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-2.5 text-xs text-zinc-400 flex items-center justify-between">
            <span>Awaiting update before 8:00 PM</span>
            <span className="text-[10px] text-zinc-500 font-mono">No reminder</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
        <span className="text-[11px] text-zinc-500 font-mono">
          ID: {employee.id}
        </span>

        <div className="flex items-center gap-2">
          {onScore && (
            <button
              type="button"
              onClick={() => onScore(employee, subjectFound)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer select-none active:scale-95"
              title="Evaluate and give manager rating (1-10)"
            >
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>Score</span>
            </button>
          )}

          {status !== 'submitted' && runId && (
            <button
              onClick={handleRemindClick}
              disabled={reminding}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-indigo-300 hover:text-white border border-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3 h-3" />
              <span>{reminding ? 'Sending...' : 'Send Reminder'}</span>
            </button>
          )}

          {status === 'submitted' && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
