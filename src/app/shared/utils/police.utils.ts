import { COLOR_AMBER, COLOR_CYAN, COLOR_GREEN, COLOR_RED } from '../constants/police.constants';
import { Level } from '../models/police.model';

/** Change % = (current − previous) / previous × 100 (previous = 0 → ±100 or 0). */
export function changePercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/** KPI-Documentation §3.2.1 — security events, current hour vs previous hour. */
export function incidentLevel(p: number): Level {
  if (p > 50) return { color: COLOR_RED, label: '⚠ تصاعد حاد' };
  if (p > 20) return { color: COLOR_AMBER, label: 'تصاعد' };
  if (p >= -20) return { color: COLOR_GREEN, label: 'استقرار أمني' };
  if (p >= -50) return { color: COLOR_CYAN, label: 'تراجع' };
  return { color: COLOR_CYAN, label: 'تراجع كبير' };
}

/** KPI-Documentation §3.2.2 — restricted area breaches, today vs yesterday. */
export function breachLevel(p: number): Level {
  if (p > 50) return { color: COLOR_RED, label: '⚠ ارتفاع حاد' };
  if (p > 20) return { color: COLOR_AMBER, label: 'ارتفاع' };
  if (p >= -20) return { color: COLOR_GREEN, label: 'مستقر' };
  if (p >= -50) return { color: COLOR_CYAN, label: 'تحسّن' };
  return { color: COLOR_CYAN, label: 'تحسّن كبير' };
}

/** Hourly bar colour: ≥70% of max red, ≥40% amber, else green. */
export function activityColor(value: number, max: number): string {
  return value >= max * 0.7 ? COLOR_RED : value >= max * 0.4 ? COLOR_AMBER : COLOR_GREEN;
}
