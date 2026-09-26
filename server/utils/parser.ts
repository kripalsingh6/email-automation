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
  if (normalizedSub.startsWith('reminder:') || normalizedSub.includes('reminder pending') || normalizedSub.includes('reminder:')) {
    return false;
  }

  const normalizedName = normalizeText(employeeName);
  const dateStr = formatDisplayDate(date);
  const altDateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

  const hasKeyword =
    normalizedSub.includes('daily task update') ||
    normalizedSub.includes('daily task') ||
    normalizedSub.includes('task update') ||
    normalizedSub.includes('daily update');

  const hasName = normalizedSub.includes(normalizedName);

  // Check if subject at least has keyword and the intern name
  if (hasKeyword && hasName) {
    return true;
  }

  // Also check if subject contains the date and name even if phrased slightly differently
  const hasDate = normalizedSub.includes(dateStr) || normalizedSub.includes(altDateStr);
  if (hasName && hasDate) {
    return true;
  }

  return false;
}

export function buildGmailQuery(
  employeeName: string,
  employeeEmail: string,
  afterDateYMD: string
): string {
  // Gmail query matching today's email from this employee
  return `from:${employeeEmail} after:${afterDateYMD} subject:("Daily Task Update" OR "Daily Update" OR "${employeeName}")`;
}
