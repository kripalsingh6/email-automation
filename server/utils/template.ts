import { buildExpectedSubject } from './parser';
import { formatDisplayDate } from './date';

export function buildReminderEmailHtml(employeeName: string, date: Date = new Date()): string {
  const displayDate = formatDisplayDate(date);
  const expectedSubject = buildExpectedSubject(employeeName, date);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Task Update Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; color: #1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f5f7; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
                Daily Task Update Reminder
              </h1>
              <p style="margin: 8px 0 0 0; color: #e0e7ff; font-size: 14px;">
                Date: ${displayDate}
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 28px;">
              <p style="font-size: 16px; line-height: 24px; margin: 0 0 16px 0; color: #374151;">
                Hi <strong>${employeeName}</strong>,
              </p>
              <p style="font-size: 15px; line-height: 24px; margin: 0 0 20px 0; color: #4b5563;">
                This is an automated reminder that we have not yet received your <strong>Daily Task Update</strong> for today (<strong>${displayDate}</strong>).
              </p>

              <!-- Warning Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; margin: 20px 0;">
                <tr>
                  <td style="padding: 16px 18px;">
                    <div style="font-weight: 600; font-size: 14px; color: #92400e; margin-bottom: 4px;">
                      Action Required
                    </div>
                    <div style="font-size: 14px; color: #78350f; line-height: 20px;">
                      Please reply or send your daily progress report as soon as possible before the end of the day.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Subject Line Guide -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 24px 0;">
                <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">
                  Recommended Email Subject:
                </p>
                <div style="background-color: #ffffff; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 10px 14px; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 14px; color: #4338ca; font-weight: 600;">
                  ${expectedSubject}
                </div>
              </div>

              <p style="font-size: 14px; line-height: 22px; color: #6b7280; margin: 20px 0 0 0;">
                If you have already submitted your update under a different subject or sent it right now, please disregard this automated notification.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; border-top: 1px solid #f3f4f6; padding: 20px 24px; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #9ca3af;">
                Automated Internal Notification System &bull; Team Operations
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function buildReminderSubject(employeeName: string, date: Date = new Date()): string {
  const displayDate = formatDisplayDate(date);
  return `Reminder: Daily Task Update Pending - ${employeeName} - ${displayDate}`;
}
