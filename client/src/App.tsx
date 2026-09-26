import { useState } from 'react';
import { useApi } from './hooks/useApi';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { LogsTable } from './components/LogsTable';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs'>('dashboard');
  const [feedback, setFeedback] = useState<string | null>(null);

  const {
    status,
    scheduler,
    employees,
    runs,
    loading,
    checking,
    error,
    triggerCheck,
    sendSingleReminder
  } = useApi();

  const handleManualCheck = async () => {
    try {
      setFeedback('Running inbox check and dispatching reminders...');
      const res = await triggerCheck(true);
      setFeedback(
        `✅ Check complete! ${res.data.submittedCount} submitted, ${res.data.missingCount} missing. ${res.remindersSent} reminders dispatched.`
      );
      setTimeout(() => setFeedback(null), 6000);
    } catch {
      setFeedback('❌ Failed to run check. Check server console for details.');
      setTimeout(() => setFeedback(null), 6000);
    }
  };

  const handleSendReminder = async (runId: number, employeeId: string) => {
    try {
      await sendSingleReminder(runId, employeeId);
      setFeedback('✉️ Reminder email sent successfully!');
      setTimeout(() => setFeedback(null), 4000);
    } catch {
      setFeedback('❌ Failed to send reminder email.');
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Header */}
      <Header
        status={status}
        scheduler={scheduler}
        checking={checking}
        onTriggerCheck={handleManualCheck}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner Feedback / Alert */}
        {feedback && (
          <div className="mb-6 p-4 rounded-xl bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/50 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-sm flex items-center justify-between shadow-sm animate-fade-in">
            <span>{feedback}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-950/50 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="text-sm font-medium">Connecting to automation server...</span>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' ? (
              <Dashboard
                status={status}
                employees={employees}
                checking={checking}
                onTriggerCheck={handleManualCheck}
                onSendReminder={handleSendReminder}
              />
            ) : (
              <LogsTable runs={runs} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Daily Task Email Automation &bull; Task 1</span>
          <span>SQLite Database &bull; Gmail API &bull; node-cron 8:00 PM Mon–Fri</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
