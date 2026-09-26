import React from 'react';
import { CheckCircle2, Clock, AlertCircle, BellRing } from 'lucide-react';
import type { SubmissionStatus } from '../types';

interface StatusBadgeProps {
  status: SubmissionStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'submitted':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          Submitted
        </span>
      );
    case 'reminded':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
          <BellRing className="w-3.5 h-3.5 text-amber-500" />
          Reminded
        </span>
      );
    case 'missing':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
          Missing
        </span>
      );
    case 'pending':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          Pending Check
        </span>
      );
  }
};
