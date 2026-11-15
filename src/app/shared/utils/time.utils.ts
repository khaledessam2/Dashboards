const pad = (n: number) => String(n).padStart(2, '0');
const hour12 = (d: Date) => d.getHours() % 12 || 12;
export const periodAr = (d: Date) => (d.getHours() < 12 ? 'ص' : 'م');

/** 12-hour time with seconds, e.g. "03:13:41 م". */
export function formatTime12(ms: number | Date): string {
  const d = new Date(ms);
  return `${pad(hour12(d))}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${periodAr(d)}`;
}

/** 12-hour whole-hour label for chart axes, e.g. "3 م". */
export function formatHour12(ms: number | Date): string {
  const d = new Date(ms);
  return `${hour12(d)} ${periodAr(d)}`;
}
