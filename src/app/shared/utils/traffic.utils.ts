import { COLOR_AMBER, COLOR_GREEN, COLOR_RED } from '../constants/traffic.constants';
import { FlowStats } from '../models/traffic-stats.model';

/** Net flow % = (entry − exit) / (entry + exit) × 100 */
export function netFlowPercent({ entry, exit }: FlowStats): number {
  return entry + exit === 0 ? 0 : ((entry - exit) / (entry + exit)) * 100;
}

export function flowLevel(net: number): { color: string; label: string } {
  if (net > 30) return { color: COLOR_RED, label: '⚠ تدفق مرتفع للدخول' };
  if (net > 10) return { color: COLOR_AMBER, label: 'تدفق متوسط للدخول' };
  if (net >= -10) return { color: COLOR_GREEN, label: 'تدفق متوازن' };
  if (net >= -30) return { color: COLOR_AMBER, label: 'تدفق متوسط للخروج' };
  return { color: COLOR_RED, label: '⚠ تدفق مرتفع للخروج' };
}

/** Hourly bar colour: ≥70% of max red, ≥40% amber, else green. */
export function activityColor(value: number, max: number): string {
  return value >= max * 0.7 ? COLOR_RED : value >= max * 0.4 ? COLOR_AMBER : COLOR_GREEN;
}
