import { useState, useEffect, useCallback } from 'react';
import type { StatusResponse, SchedulerStatus, CheckRun, Employee } from '../types';

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
        fetch('/api/status').then(r => r.json()),
        fetch('/api/scheduler').then(r => r.json()),
        fetch('/api/employees').then(r => r.json()),
        fetch('/api/logs?limit=20').then(r => r.json())
      ]);

      setStatus(statusRes);
      setScheduler(schedRes);
      setEmployees(empRes.employees || []);
      setRuns(logsRes.runs || []);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(msg);
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

  const triggerCheck = async (sendReminders = true) => {
    try {
      setChecking(true);
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendReminders })
      });
      const data = await res.json();
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
      const res = await fetch('/api/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId, employeeId })
      });
      await fetchAll();
      return await res.json();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reminder failed';
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
    sendSingleReminder
  };
}
