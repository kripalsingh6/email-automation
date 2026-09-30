import { useState, useEffect, useCallback } from 'react';
import type { StatusResponse, SchedulerStatus, CheckRun, Employee } from '../types';
import { apiUrl } from '../utils/api';
import { FALLBACK_EMPLOYEES } from '../data/fallback-data';

export function useApi() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [scheduler, setScheduler] = useState<SchedulerStatus | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [runs, setRuns] = useState<CheckRun[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [checking, setChecking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [statusRes, schedRes, empRes, logsRes] = await Promise.all([
        fetch(apiUrl('/api/status')).then(r => r.json()),
        fetch(apiUrl('/api/scheduler')).then(r => r.json()),
        fetch(apiUrl('/api/employees')).then(r => r.json()),
        fetch(apiUrl('/api/logs?limit=20')).then(r => r.json())
      ]);

      setStatus(statusRes);
      setScheduler(schedRes);
      setEmployees(empRes.employees || []);
      setRuns(logsRes.runs || []);
      setError(null);
    } catch {
      // In standalone frontend deployments (e.g. Vercel preview), gracefully load fallback data
      setEmployees(prev => (prev.length ? prev : ([...FALLBACK_EMPLOYEES] as any)));
      setStatus(prev => prev || {
        date: new Date().toISOString().slice(0, 10),
        isWeekday: true,
        totalEmployees: FALLBACK_EMPLOYEES.length,
        latestRun: null,
        results: [],
        gmail: { configured: true, authenticated: true }
      });
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      void fetchAll();
    }
    const interval = setInterval(() => {
      void fetchAll();
    }, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchAll]);

  const triggerCheck = async (sendReminders = true, forceReminders = true) => {
    try {
      setChecking(true);
      const res = await fetch(apiUrl('/api/check'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendReminders, forceReminders })
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(
          'Backend connection failed. If on Vercel, please set VITE_API_URL to your Render backend URL in Vercel Project Settings.'
        );
      }

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || data.message || `Check request failed (${res.status})`);
      }

      await fetchAll();
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Check failed';
      setError(msg);
      throw err;
    } finally {
      setChecking(false);
    }
  };

  const sendSingleReminder = async (runId: number, employeeId: string) => {
    try {
      const res = await fetch(apiUrl('/api/remind'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId, employeeId })
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Backend connection failed. Please check VITE_API_URL.');
      }

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || data.message || `Reminder failed (${res.status})`);
      }

      await fetchAll();
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reminder failed';
      setError(msg);
      throw err;
    }
  };

  const addEmployee = async (emp: { name: string; email: string; role?: string }) => {
    try {
      const res = await fetch(apiUrl('/api/employees'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emp)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add intern');
      }
      await fetchAll();
      return data.employee;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add intern';
      setError(msg);
      throw err;
    }
  };

  const updateEmployee = async (id: string, emp: { name?: string; email?: string; role?: string; active?: boolean }) => {
    try {
      const res = await fetch(apiUrl(`/api/employees/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emp)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update intern');
      }
      await fetchAll();
      return data.employee;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update intern';
      setError(msg);
      throw err;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      const res = await fetch(apiUrl(`/api/employees/${id}`), {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove intern');
      }
      await fetchAll();
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove intern';
      setError(msg);
      throw err;
    }
  };

  const scoreEmployee = async (scoreData: {
    employee_id: string;
    date?: string;
    manager_rating: number;
    self_rating?: number;
    status?: string;
    severity?: string;
    category?: string;
    deadline_met?: boolean;
    tasks?: string;
    tomorrows_tasks?: string;
    link?: string;
  }) => {
    try {
      const res = await fetch(apiUrl('/api/reports/score'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scoreData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit score');
      }
      await fetchAll();
      return data.report;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit score';
      setError(msg);
      throw err;
    }
  };

  return {
    status,
    scheduler,
    employees,
    runs,
    loading,
    checking,
    error,
    refresh: fetchAll,
    triggerCheck,
    sendSingleReminder,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    scoreEmployee
  };
}
