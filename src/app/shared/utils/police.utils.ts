/** Change % = (current − previous) / previous × 100 (previous = 0 → ±100 or 0). */
export function changePercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}
