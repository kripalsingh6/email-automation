import { useState, useEffect, useCallback } from 'react';
import { useApi } from './hooks/useApi';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { LogsTable } from './components/LogsTable';
import { PerformanceDashboard } from './components/PerformanceDashboard';
import type { ScoreData } from './components/ScoreInternModal';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { DailyReport } from './types/performance';

type AppTab = 'dashboard' | 'logs' | 'performance';

export function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);

  const {
    status,
    scheduler,
    employees,
    runs,
    loading,
    checking,
    error,
    triggerCheck,
    sendSingleReminder,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    scoreEmployee
  } = useApi();

  const fetchReports = useCallback(() => {
    fetch('/api/reports')
      .then(r => r.json())
      .then(data => setDailyReports(data.reports || []))
      .catch(err => console.error('Failed to load daily reports:', err));
  }, []);

  // Fetch daily report data on mount and whenever switching to performance tab
  useEffect(() => {
    fetchReports();
  }, [fetchReports, activeTab]);

  const handleManualCheck = async () => {
    try {
      setFeedback('Running inbox check and dispatching reminders...');
      const res = await triggerCheck(true);
      fetchReports();
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

  const handleAddEmployee = async (emp: { name: string; email: string; role?: string }) => {
    try {
      const added = await addEmployee(emp);
      setFeedback(`✅ Intern ${added.name} (${added.email}) added successfully!`);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add intern';
      setFeedback(`❌ ${msg}`);
      setTimeout(() => setFeedback(null), 5000);
      throw err;
    }
  };

  const handleUpdateEmployee = async (id: string, emp: { name?: string; email?: string; role?: string; active?: boolean }) => {
    try {
      const updated = await updateEmployee(id, emp);
      setFeedback(`✅ Intern ${updated.name} updated with Gmail: ${updated.email}!`);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update intern';
      setFeedback(`❌ ${msg}`);
      setTimeout(() => setFeedback(null), 5000);
      throw err;
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      await deleteEmployee(id);
      setFeedback('✅ Intern removed successfully!');
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove intern';
      setFeedback(`❌ ${msg}`);
      setTimeout(() => setFeedback(null), 5000);
      throw err;
    }
  };

  const handleScoreIntern = async (scoreData: ScoreData) => {
    try {
      await scoreEmployee(scoreData);
      fetchReports();
      setFeedback(`⭐ Evaluation & score saved! ML analytics and charts updated.`);
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save score';
      setFeedback(`❌ ${msg}`);
      setTimeout(() => setFeedback(null), 5000);
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white">
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
          <div className="mb-6 p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/80 text-indigo-200 text-sm flex items-center justify-between shadow-lg shadow-black/40 animate-fade-in backdrop-blur-sm">
            <span>{feedback}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-200 text-sm flex items-center gap-3 backdrop-blur-sm shadow-lg shadow-black/40">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-3 text-zinc-500">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
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
                onAddEmployee={handleAddEmployee}
                onUpdateEmployee={handleUpdateEmployee}
                onDeleteEmployee={handleDeleteEmployee}
                onScoreIntern={handleScoreIntern}
              />
            ) : activeTab === 'logs' ? (
              <LogsTable runs={runs} />
            ) : (
              <PerformanceDashboard
                reports={dailyReports}
                employees={employees}
                onScoreIntern={handleScoreIntern}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-500 bg-black/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Daily Task Email Automation &bull; Task 1 + Performance Dashboard &bull; Task 2</span>
          <span>SQLite &bull; Gmail API &bull; Chart.js &bull; ML Analytics &bull; node-cron 8:00 PM Mon–Fri</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
