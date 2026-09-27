import { formatDisplayDate } from './date';

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
  date: Date = new Date()
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
    normalizedSub.includes('todays task');

  // If the email contains a task update keyword, it's a valid submission from this intern
  if (hasKeyword) {
    return true;
  }

  // Also check if subject contains the employee's name
  if (normalizedName && normalizedSub.includes(normalizedName)) {
    return true;
  }

  // Also check if subject contains today's date and "task" or "update" or "report"
  const hasDate = normalizedSub.includes(dateStr) || normalizedSub.includes(altDateStr);
  if (hasDate && (normalizedSub.includes('task') || normalizedSub.includes('update') || normalizedSub.includes('report'))) {
    return true;
  }

  return false;
}

export function buildGmailQuery(
  employeeName: string,
  employeeEmail: string,
  afterDateYMD: string
): string {
  // Gmail query matching today's email from this employee's address
  return `from:${employeeEmail} after:${afterDateYMD}`;
}
