import React, { useState, useEffect } from 'react';
import { X, Star, Calendar, CheckCircle2, AlertCircle, ExternalLink, ListChecks, ArrowRightCircle, Tag, ShieldAlert } from 'lucide-react';
import type { Employee } from '../types';

export interface ScoreData {
  employee_id: string;
  date: string;
  manager_rating: number;
  self_rating: number;
  status: 'Completed' | 'In Progress' | 'Blocked' | 'Not Started';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  category: string;
  deadline_met: boolean;
  tasks: string;
  tomorrows_tasks?: string;
  link?: string;
}

interface ScoreInternModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  defaultDate?: string;
  defaultTasks?: string;
  onSaveScore: (scoreData: ScoreData) => Promise<void>;
}

const CATEGORIES = [
  'Development',
  'Frontend',
  'Backend',
  'Testing',
  'DevOps',
  'Design',
  'Management',
  'Documentation'
];

export const ScoreInternModal: React.FC<ScoreInternModalProps> = ({
  isOpen,
  onClose,
  employee,
  defaultDate,
  defaultTasks,
  onSaveScore
}) => {
  const todayStr = defaultDate || new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(todayStr);
  const [managerRating, setManagerRating] = useState<number>(8);
  const [selfRating, setSelfRating] = useState<number>(8);
  const [taskStatus, setTaskStatus] = useState<'Completed' | 'In Progress' | 'Blocked' | 'Not Started'>('Completed');
  const [severity, setSeverity] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('High');
  const [category, setCategory] = useState<string>('Development');
  const [deadlineMet, setDeadlineMet] = useState<boolean>(true);
  const [tasks, setTasks] = useState('');
  const [tomorrowsTasks, setTomorrowsTasks] = useState('');
  const [link, setLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && employee) {
      setDate(defaultDate || new Date().toISOString().slice(0, 10));
      setManagerRating(8);
      setSelfRating(8);
      setTaskStatus('Completed');
      setSeverity('High');
      
      const roleLower = employee.role.toLowerCase();
      if (roleLower.includes('frontend')) setCategory('Frontend');
      else if (roleLower.includes('backend')) setCategory('Backend');
      else if (roleLower.includes('qa') || roleLower.includes('testing')) setCategory('Testing');
      else if (roleLower.includes('devops')) setCategory('DevOps');
      else if (roleLower.includes('lead') || roleLower.includes('management')) setCategory('Management');
      else setCategory('Development');

      setDeadlineMet(true);
      setTasks(defaultTasks || '');
      setTomorrowsTasks('');
      setLink('');
      setError(null);
    }
  }, [isOpen, employee, defaultDate, defaultTasks]);

  if (!isOpen || !employee) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await onSaveScore({
        employee_id: employee.id,
        date,
        manager_rating: managerRating,
        self_rating: selfRating,
        status: taskStatus,
        severity,
        category,
        deadline_met: deadlineMet,
        tasks: tasks.trim() || 'Daily task deliverables completed',
        tomorrows_tasks: tomorrowsTasks.trim() || 'Continue sprint backlog deliverables',
        link: link.trim()
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save score';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getScoreBadgeText = (score: number) => {
    if (score >= 9) return 'Exceptional / Top Performer';
    if (score >= 8) return 'Exceeds Expectations';
    if (score >= 7) return 'Meets Expectations';
    if (score >= 5) return 'Needs Improvement';
    return 'Critical Attention';
  };

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80';
    if (score >= 7) return 'text-indigo-400 bg-indigo-950/60 border-indigo-800/80';
    if (score >= 5) return 'text-amber-400 bg-amber-950/60 border-amber-800/80';
    return 'text-rose-400 bg-rose-950/60 border-rose-800/80';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl shadow-black/80 space-y-5 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/30">
              {employee.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-bold text-white m-0">
                Daily Work Report & Evaluation
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                <span className="font-semibold text-zinc-200">{employee.name}</span> &bull; {employee.role} &bull; <span className="font-mono text-zinc-400">{employee.email}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* How to Fill Guidance Banner matching Sheet Instructions */}
        <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
          <div className="flex items-center justify-between text-zinc-300 font-semibold mb-1">
            <span className="flex items-center gap-1.5 text-indigo-400">
              <ListChecks className="w-3.5 h-3.5" />
              Daily Report Guidelines
            </span>
            <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
              Yellow cells editable
            </span>
          </div>
          <p className="m-0">
            &bull; List up to 5 tasks in Task Description (1 line per task).
            &bull; Provide Tomorrow's planned tasks.
            &bull; Select Category, Status, Severity, and Ratings from dropdowns.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Date & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="eval-date" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Report Date (DD/MM/YYYY)
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="eval-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-zinc-800 bg-zinc-950 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="eval-category" className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-zinc-400" />
                Work Category
              </label>
              <select
                id="eval-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-800 bg-zinc-950 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Manager Rating (1 to 10) */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                Manager Rating (1–10)
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${getScoreColor(managerRating)}`}>
                {managerRating} / 10 &bull; {getScoreBadgeText(managerRating)}
              </span>
            </div>

            {/* 1 to 10 Button Pill Bar */}
            <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                const isSelected = managerRating === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setManagerRating(num)}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                      isSelected
                        ? num >= 9
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/40 scale-105'
                          : num >= 7
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 scale-105'
                          : num >= 5
                          ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/40 scale-105'
                          : 'bg-rose-600 text-white shadow-lg shadow-rose-600/40 scale-105'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Intern Self-Rating (1–10) */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 mb-1.5">
              <span>Intern Self-Rating</span>
              <span className="text-indigo-400 font-bold font-mono">{selfRating} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={selfRating}
              onChange={(e) => setSelfRating(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Row 4: Status, Severity & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="eval-status" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Task Status
              </label>
              <select
                id="eval-status"
                value={taskStatus}
                onChange={(e) => setTaskStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-800 bg-zinc-950 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
              >
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Blocked">Blocked</option>
                <option value="Not Started">Not Started</option>
              </select>
            </div>

            <div>
              <label htmlFor="eval-severity" className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-zinc-400" />
                Task Severity
              </label>
              <select
                id="eval-severity"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-800 bg-zinc-950 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Deadline Met
              </label>
              <button
                type="button"
                onClick={() => setDeadlineMet(!deadlineMet)}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  deadlineMet
                    ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60'
                    : 'bg-rose-950/60 border-rose-800/80 text-rose-300 hover:bg-rose-900/60'
                }`}
              >
                {deadlineMet ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>On-Time Met</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Missed</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Row 5: Task Description (up to 5 tasks, one per line) */}
          <div>
            <label htmlFor="tasks-text" className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center justify-between">
              <span>Task Description / Completed Work</span>
              <span className="text-[10px] text-zinc-500 font-normal">Up to 5 tasks, 1 line per task</span>
            </label>
            <textarea
              id="tasks-text"
              rows={3}
              value={tasks}
              onChange={(e) => setTasks(e.target.value)}
              placeholder="e.g.&#10;1. Implemented auth endpoints&#10;2. Configured database schema migration&#10;3. Added unit tests with 95% coverage"
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-sans"
            />
          </div>

          {/* Row 6: Tomorrow's Tasks (up to 5 lines) */}
          <div>
            <label htmlFor="tomorrows-tasks-text" className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <ArrowRightCircle className="w-3.5 h-3.5 text-indigo-400" />
                Tomorrow's Tasks
              </span>
              <span className="text-[10px] text-zinc-500 font-normal">Up to 5 lines, 1 per planned task</span>
            </label>
            <textarea
              id="tomorrows-tasks-text"
              rows={2}
              value={tomorrowsTasks}
              onChange={(e) => setTomorrowsTasks(e.target.value)}
              placeholder="e.g.&#10;1. Complete integration tests&#10;2. Prepare deployment PR"
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-sans"
            />
          </div>

          {/* Row 7: Evidence Link */}
          <div>
            <label htmlFor="evidence-link" className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1">
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              Evidence Link (PR, ticket, doc, deployment)
            </label>
            <input
              id="evidence-link"
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://github.com/organization/repo/pull/123"
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-mono"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 shadow-md shadow-emerald-500/25 transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Updating...' : 'Save Report & Update ML'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
