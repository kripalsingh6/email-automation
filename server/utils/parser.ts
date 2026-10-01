import { formatDisplayDate, getTodayDateString } from './date';

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, '-') // normalize all dash/hyphen variants
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildExpectedSubject(name: string, date: Date = new Date()): string {
  const dateStr = formatDisplayDate(date);
  return `Daily Task Update - ${name} - ${dateStr}`;
}

export function matchesExpectedSubject(
  subject: string,
  employeeName: string,
  date: Date = new Date(),
  emailDateStr?: string
): boolean {
  if (!subject) return false;

  const normalizedSub = normalizeText(subject);

  // Ignore reminder emails sent by the system
  if (
    normalizedSub.startsWith('reminder:') ||
    normalizedSub.includes('reminder pending') ||
    normalizedSub.includes('reminder: pending')
  ) {
    return false;
  }

  const normalizedName = normalizeText(employeeName);
  const firstName = normalizedName.split(' ')[0];
  const dateStr = formatDisplayDate(date);
  const altDateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

  const hasKeyword =
    normalizedSub.includes('daily task update') ||
    normalizedSub.includes('daily task') ||
    normalizedSub.includes('task update') ||
    normalizedSub.includes('daily update') ||
    normalizedSub.includes('daily report') ||
    normalizedSub.includes('task report') ||
    normalizedSub.includes('status update') ||
    normalizedSub.includes('work update') ||
    normalizedSub.includes('today task') ||
    normalizedSub.includes('todays task') ||
    normalizedSub.includes('task') ||
    normalizedSub.includes('report') ||
    normalizedSub.includes('update') ||
    normalizedSub.includes('standup') ||
    normalizedSub.includes('eod') ||
    normalizedSub.includes('work') ||
    normalizedSub.includes('submission');

  // If the email contains a task update keyword, it's a valid submission from this intern
  if (hasKeyword) {
    return true;
  }

  // Also check if subject contains the employee's name or first name
  if (normalizedName && normalizedSub.includes(normalizedName)) {
    return true;
  }
  if (firstName && firstName.length > 2 && normalizedSub.includes(firstName)) {
    return true;
  }

  // Also check if subject contains today's date
  const hasDate = normalizedSub.includes(dateStr) || normalizedSub.includes(altDateStr);
  if (hasDate) {
    return true;
  }

  // If email date is within today, and sent by this intern, treat as daily submission
  if (emailDateStr) {
    try {
      const emailDate = new Date(emailDateStr);
      if (getTodayDateString(emailDate) === getTodayDateString(date)) {
        return true;
      }
    } catch {
      // ignore date parse errors
    }
  }

  return false;
}

export function buildGmailQuery(
  _employeeName: string,
  employeeEmail: string,
  _afterDateYMD?: string
): string {
  // Query recent emails from this intern (newer_than:2d avoids strict midnight UTC query failures)
  const cleanEmail = employeeEmail.trim().toLowerCase();
  return `from:${cleanEmail} newer_than:2d`;
}
