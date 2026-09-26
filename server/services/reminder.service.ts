import type { Employee } from '../types';
import { buildReminderEmailHtml, buildReminderSubject } from '../utils/template';
import { sendEmail } from './gmail.service';
import { updateResultsStatusByRunAndEmployee } from '../db/queries';

export interface ReminderResult {
  sentCount: number;
  remindedEmployees: { id: string; name: string; email: string; success: boolean; error?: string }[];
}

export async function sendReminders(
  missingEmployees: Employee[],
  runId: number
): Promise<ReminderResult> {
  const now = new Date();
  const timestamp = now.toISOString();
  const remindedEmployees: { id: string; name: string; email: string; success: boolean; error?: string }[] = [];
  let sentCount = 0;

  console.log(`✉️ [Reminder Service] Sending reminder emails to ${missingEmployees.length} pending interns for run ${runId}...`);

  for (const emp of missingEmployees) {
    try {
      const subject = buildReminderSubject(emp.name, now);
      const htmlBody = buildReminderEmailHtml(emp.name, now);

      await sendEmail(emp.email, subject, htmlBody);

      // Update DB record to 'reminded'
      updateResultsStatusByRunAndEmployee(runId, emp.id, 'reminded', timestamp);

      remindedEmployees.push({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        success: true
      });
      sentCount++;
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to send reminder email to ${emp.name} (${emp.email}):`, errMsg);
      remindedEmployees.push({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        success: false,
        error: errMsg
      });
    }
  }

  console.log(`📨 [Reminder Service] Finished. ${sentCount}/${missingEmployees.length} reminders successfully dispatched.`);

  return {
    sentCount,
    remindedEmployees
  };
}
