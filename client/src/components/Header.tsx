import React from 'react';
import { MailCheck, RefreshCw, Play, CheckCircle, AlertTriangle, Activity, History, BarChart3 } from 'lucide-react';
import type { StatusResponse, SchedulerStatus } from '../types';

type AppTab = 'dashboard' | 'logs' | 'performance';

interface HeaderProps {
  status: StatusResponse | null;
  scheduler: SchedulerStatus | null;
  checking: boolean;
  onTriggerCheck: () => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  scheduler: _scheduler,
  checking,
  onTriggerCheck,
  activeTab,
  setActiveTab
}) => {
  const isGmailAuth = status?.gmail.authenticated;

  const tabs: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Live Status', icon: <Activity className="w-4 h-4 shrink-0" /> },
    { id: 'logs', label: 'Check Logs', icon: <History className="w-4 h-4 shrink-0" /> },
    { id: 'performance', label: 'Performance', icon: <BarChart3 className="w-4 h-4 shrink-0" /> },
  ];

  return (
    <header className="bg-black/95 backdrop-blur-md border-b border-zinc-900 sticky top-0 z-30 transition-all shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Header Row */}
        <div className="flex flex-wrap items-center justify-between py-3.5 gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
              <MailCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2 m-0">
                Email Automation & Analytics
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-900 text-indigo-400 border border-zinc-800">
                  v1.0
                </span>
              </h1>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 truncate max-w-xs sm:max-w-md">
                Inbox: <span className="font-semibold text-indigo-400">thakurkripalsingh6@gmail.com</span>
              </p>
            </div>
          </div>

          {/* Large Screen Navigation Tabs (Hidden on medium/small, shown on lg+) */}
          <nav className="hidden lg:flex items-center p-1 bg-zinc-950/90 rounded-xl border border-zinc-800/90 shadow-inner">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer select-none ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/80'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Action Bar */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Gmail Connection Status */}
            {isGmailAuth ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800/80">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="hidden sm:inline">Gmail Connected</span>
                <span className="sm:hidden">Connected</span>
              </span>
            ) : (
              <a
                href="/auth/google"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-950/70 text-amber-300 border border-amber-800/80 hover:bg-amber-900/80 transition-colors cursor-pointer"
                title="Click to authenticate Team Lead Gmail via OAuth 2.0"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Connect Gmail</span>
              </a>
            )}

            {/* Run Check Now Button */}
            <button
              type="button"
              onClick={onTriggerCheck}
              disabled={checking}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer select-none"
            >
              {checking ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin shrink-0" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current shrink-0" />
                  <span>Run Check Now</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Medium & Mobile Screen Navigation Tabs (Visible on < lg screens) */}
        <nav className="flex lg:hidden pb-3 pt-1">
          <div className="grid grid-cols-3 w-full p-1 bg-zinc-950/90 rounded-xl border border-zinc-800/90 gap-1 shadow-inner">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer select-none text-center ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/80'
                  }`}
                >
                  {tab.icon}
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
};
