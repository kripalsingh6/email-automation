export function getTodayDateString(
  date: Date = new Date(),
  timeZone: string = process.env.TIMEZONE || 'Asia/Kolkata'
): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone
    });
    return formatter.format(date); // Formats as YYYY-MM-DD
  } catch {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}

export function formatDisplayDate(date: Date = new Date()): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function isWeekday(date: Date = new Date()): boolean {
  const day = date.getDay(); // 0 is Sunday, 6 is Saturday
  return day >= 1 && day <= 5;
}

export function getISOTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}

export function isPastDeadline(
  date: Date = new Date(),
  deadlineHour: number = 20,
  timeZone: string = process.env.TIMEZONE || 'Asia/Kolkata'
): boolean {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone
    }).formatToParts(date);
    const hourPart = parts.find(p => p.type === 'hour');
    const hour = hourPart ? parseInt(hourPart.value, 10) : date.getHours();
    return hour >= deadlineHour;
  } catch {
    return date.getHours() >= deadlineHour;
  }
}
