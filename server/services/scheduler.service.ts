import cron, { ScheduledTask } from 'node-cron';
import { env } from '../config/env';
import { isWeekday } from '../utils/date';
import { checkDailySubmissions } from './checker.service';
import { sendReminders } from './reminder.service';
import type { SchedulerStatusResponse } from '../types';

let scheduledTask: ScheduledTask | null = null;
let lastRunTime: string | null = null;

export function startScheduler(): void {
  if (scheduledTask) {
    console.log('[Scheduler Service] Scheduler is already running.');
    return;
  }

  const cronExpr = env.CHECK_CRON || '0 20 * * 1-5';

  if (!cron.validate(cronExpr)) {
    console.error(`❌ [Scheduler Service] Invalid cron expression: "${cronExpr}"`);
    return;
  }

  console.log(`⏰ [Scheduler Service] Initializing scheduler with expression: "${cronExpr}" (Mon-Fri 8:00 PM)`);

  scheduledTask = cron.schedule(cronExpr, async () => {
    const now = new Date();
    lastRunTime = now.toISOString();
    console.log(`\n🔔 [Scheduler] Cron triggered at ${now.toLocaleTimeString()} (${now.toDateString()})`);

    // Check if weekday
    if (!isWeekday(now)) {
      console.log('⏭️ [Scheduler] Weekend detected. Skipping daily check.');
      return;
    }

    try {
      // 1. Run check
      const checkResult = await checkDailySubmissions('scheduled');

      // 2. If any missing, send reminders
      if (checkResult.missing.length > 0) {
        console.log(`⚠️ [Scheduler] ${checkResult.missing.length} intern(s) have not submitted today. Dispatching reminders...`);
        await sendReminders(checkResult.missing, checkResult.runId);
      } else {
        console.log('🎉 [Scheduler] All interns have submitted their daily updates today! No reminders needed.');
      }
    } catch (error) {
      console.error('❌ [Scheduler] Error during scheduled check run:', error);
    }
  });

  console.log('✅ [Scheduler Service] Scheduler started successfully.');
}

export function stopScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('🛑 [Scheduler Service] Scheduler stopped.');
  }
}

export function getSchedulerStatus(): SchedulerStatusResponse {
  return {
    isRunning: Boolean(scheduledTask),
    cronExpression: env.CHECK_CRON || '0 20 * * 1-5',
    nextRunTime: lastRunTime,
    isWeekdayToday: isWeekday(new Date())
  };
}
