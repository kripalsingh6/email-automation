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
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/80">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Submitted
        </span>
      );
    case 'reminded':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/80">
          <BellRing className="w-3.5 h-3.5 text-amber-400" />
          Reminded
        </span>
      );
    case 'missing':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/80">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          Missing
        </span>
      );
    case 'pending':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          Pending Check
        </span>
      );
  }
};
