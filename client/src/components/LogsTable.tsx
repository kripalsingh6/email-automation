import React, { useState } from 'react';
import { History, ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import type { CheckRun, CheckResult } from '../types';
import { StatusBadge } from './StatusBadge';

interface LogsTableProps {
  runs: CheckRun[];
}

export const LogsTable: React.FC<LogsTableProps> = ({ runs }) => {
  const [expandedRunId, setExpandedRunId] = useState<number | null>(null);
  const [runDetails, setRunDetails] = useState<Record<number, CheckResult[]>>({});
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  const toggleExpand = async (runId: number) => {
    if (expandedRunId === runId) {
      setExpandedRunId(null);
      return;
    }

    setExpandedRunId(runId);

    if (!runDetails[runId]) {
      try {
        setLoadingDetails(true);
        const res = await fetch(`/api/logs/${runId}`).then(r => r.json());
        setRunDetails(prev => ({ ...prev, [runId]: res.results || [] }));
      } catch (err) {
        console.error('Failed to fetch run details:', err);
      } finally {
        setLoadingDetails(false);
      }
    }
  };

  return (
    <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 shadow-xl shadow-black/50 overflow-hidden">
      <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-zinc-800 text-indigo-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white m-0">Check Run History</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Audit log of all scheduled and manual checks</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
          {runs.length} runs recorded
        </span>
      </div>

      {runs.length === 0 ? (
        <div className="p-12 text-center text-zinc-500 text-sm">
          No check runs recorded in the database yet.
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/80">
          {runs.map(run => {
            const isExpanded = expandedRunId === run.id;
            const details = runDetails[run.id] || [];
            const compliancePct = run.total > 0 ? Math.round((run.submitted / run.total) * 100) : 0;

            return (
              <div key={run.id} className="transition-colors hover:bg-zinc-800/40">
                {/* Main Row */}
                <div
                  onClick={() => toggleExpand(run.id)}
                  className="p-5 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-4">
                    <button className="text-zinc-500 hover:text-white transition-colors">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-sm text-white">
                          Run #{run.id} &bull; {run.run_date}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            run.trigger === 'scheduled'
                              ? 'bg-purple-950/70 text-purple-300 border border-purple-800/60'
                              : 'bg-blue-950/70 text-blue-300 border border-blue-800/60'
                          }`}
                        >
                          {run.trigger}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{new Date(run.run_time).toLocaleTimeString()} ({new Date(run.run_time).toLocaleDateString()})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Stat counts */}
                    <div className="hidden sm:flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {run.submitted} submitted
                      </span>
                      <span className="flex items-center gap-1 text-rose-400 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {run.missing} missing
                      </span>
                    </div>

                    {/* Compliance Badge */}
                    <div className="text-right">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-200 border border-zinc-700">
                        {compliancePct}% compliant
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details Sub-table */}
                {isExpanded && (
                  <div className="px-6 pb-5 pt-1 bg-black/50">
                    <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950">
                      {loadingDetails && !details.length ? (
                        <div className="p-4 text-center text-xs text-zinc-500">Loading details...</div>
                      ) : (
                        <table className="w-full text-left text-xs">
                          <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800">
                            <tr>
                              <th className="py-2.5 px-4 font-semibold">Intern</th>
                              <th className="py-2.5 px-4 font-semibold">Email</th>
                              <th className="py-2.5 px-4 font-semibold">Status</th>
                              <th className="py-2.5 px-4 font-semibold">Detail</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/80">
                            {details.map(item => (
                              <tr key={item.id} className="hover:bg-zinc-900/50">
                                <td className="py-2.5 px-4 font-medium text-white">
                                  {item.employee_name}
                                </td>
                                <td className="py-2.5 px-4 text-zinc-300 font-mono">
                                  {item.email}
                                </td>
                                <td className="py-2.5 px-4">
                                  <StatusBadge status={item.status} />
                                </td>
                                <td className="py-2.5 px-4 text-zinc-400 font-mono text-[11px] truncate max-w-xs">
                                  {item.subject_found || (item.reminder_sent_at ? `Reminded at ${new Date(item.reminder_sent_at).toLocaleTimeString()}` : '-')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
