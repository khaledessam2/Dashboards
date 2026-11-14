import { AlertSeverity, PrtgStatus, SensorKind } from '../models/datacenter.model';

export const COLOR_RED = '#e74c3c';
export const COLOR_AMBER = '#f5a623';
export const COLOR_GREEN = '#00a651';
export const COLOR_CYAN = '#00bcd4';
export const COLOR_PURPLE = '#8b5cf6';
export const COLOR_GRAY = '#8a99af';

/** §4.10 — Up green, Down red, Warning amber, Unusual purple, Paused gray. */
export const STATUS_META: Record<PrtgStatus, { ar: string; color: string }> = {
  up: { ar: 'يعمل', color: COLOR_GREEN },
  down: { ar: 'متوقف', color: COLOR_RED },
  warning: { ar: 'تحذير', color: COLOR_AMBER },
  unusual: { ar: 'غير معتاد', color: COLOR_PURPLE },
  paused: { ar: 'متوقف مؤقتاً', color: COLOR_GRAY },
};

/** Worst-first order used by the devices list (§4.9). */
export const STATUS_ORDER: PrtgStatus[] = ['down', 'warning', 'unusual', 'up', 'paused'];

/** §4.8 — alert severity classes. */
export const ALERT_META: Record<AlertSeverity, { ar: string; icon: string; color: string }> = {
  critical: { ar: 'حرج', icon: 'emergency_home', color: COLOR_RED },
  warning: { ar: 'تحذير', icon: 'warning', color: COLOR_AMBER },
  unusual: { ar: 'غير معتاد', icon: 'search', color: COLOR_PURPLE },
  info: { ar: 'معلومة', icon: 'check_circle', color: COLOR_GREEN },
};

export const SENSOR_AR: Record<SensorKind, string> = {
  ping: 'زمن الاستجابة',
  cpu: 'حمل المعالج',
  memory: 'الذاكرة',
  disk: 'القرص',
  traffic: 'حركة الشبكة',
  temperature: 'درجة الحرارة',
};

/** §4.1 — RAM gauge is relative to a 4 GB ceiling, network gauge to 1 Gbps. */
export const RAM_CEILING_GB = 4;
export const NETWORK_CAPACITY_MBIT = 1000;

/** Gauge colour: <60% green, <80% amber, else red. */
export function loadColor(pct: number): string {
  return pct >= 80 ? COLOR_RED : pct >= 60 ? COLOR_AMBER : COLOR_GREEN;
}

/** §4.5 — >100 Mbit/s amber, >50 cyan, else green. */
export function trafficColor(mbit: number): string {
  return mbit > 100 ? COLOR_AMBER : mbit > 50 ? COLOR_CYAN : COLOR_GREEN;
}

/** §4.6 — ping: >20ms amber, >5ms cyan, else green. */
export function pingColor(ms: number): string {
  return ms > 20 ? COLOR_AMBER : ms > 5 ? COLOR_CYAN : COLOR_GREEN;
}

/** §4.6 — cpu: >80% red, >50% amber, else green. */
export function cpuColor(pct: number): string {
  return pct > 80 ? COLOR_RED : pct > 50 ? COLOR_AMBER : COLOR_GREEN;
}

/** §4.6 — temperature: >50°C red, >40°C amber, else green. */
export function tempColor(c: number): string {
  return c > 50 ? COLOR_RED : c > 40 ? COLOR_AMBER : COLOR_GREEN;
}
