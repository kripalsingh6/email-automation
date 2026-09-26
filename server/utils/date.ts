export function getTodayDateString(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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
