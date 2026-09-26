import React from 'react';
import { MailCheck, RefreshCw, Play, CheckCircle, AlertTriangle } from 'lucide-react';
import type { StatusResponse, SchedulerStatus } from '../types';

interface HeaderProps {
  status: StatusResponse | null;
  scheduler: SchedulerStatus | null;
  checking: boolean;
  onTriggerCheck: () => void;
  activeTab: 'dashboard' | 'logs';
  setActiveTab: (tab: 'dashboard' | 'logs') => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  scheduler,
  checking,
  onTriggerCheck,
  activeTab,
  setActiveTab
}) => {
  const isGmailAuth = status?.gmail.authenticated;

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <MailCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 m-0">
                Daily Task Email Automation
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Task 1
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automated 8:00 PM Weekday Check &bull; Inbox: <span className="font-semibold text-indigo-600 dark:text-indigo-400">thakurkripalsingh6@gmail.com</span>
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="hidden md:flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Today's Live Status
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'logs'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Check History & Logs
            </button>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-3">
            {/* Gmail Connection Status */}
            {isGmailAuth ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Gmail Connected
              </span>
            ) : (
              <a
                href="/auth/google"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 transition-colors"
                title="Click to authenticate Team Lead Gmail via OAuth 2.0"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Connect Gmail
              </a>
            )}

            {/* Scheduler Status Badge */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                Cron: {scheduler?.cronExpression || '8:00 PM Weekdays'}
              </span>
            </div>

            {/* Run Check Now Button */}
            <button
              onClick={onTriggerCheck}
              disabled={checking}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
            >
              {checking ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Checking Inbox...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run Check Now</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="flex md:hidden pb-3 gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium text-center ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Today's Status
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium text-center ${
              activeTab === 'logs'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            History & Logs
          </button>
        </div>
      </div>
    </header>
  );
};
