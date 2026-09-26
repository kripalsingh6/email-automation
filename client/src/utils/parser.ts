export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildExpectedSubject(name: string, date: Date = new Date()): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `Daily Task Update - ${name} - ${dd}/${mm}/${yyyy}`;
}
