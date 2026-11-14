import { PoliceEventName } from '../models/police.model';

export const COLOR_RED = '#e74c3c';
export const COLOR_AMBER = '#f5a623';
export const COLOR_GREEN = '#00a651';
export const COLOR_CYAN = '#00bcd4';

/** KPI-Documentation §3.6 — event types tracked by the police videowall. */
export const POLICE_EVENT_META: Record<PoliceEventName, { ar: string; icon: string; severity: 'critical' | 'warning' }> = {
  'Restricted Area Entry': { ar: 'دخول منطقة محظورة', icon: 'block', severity: 'critical' },
  'Left Object': { ar: 'جسم متروك', icon: 'inventory_2', severity: 'critical' },
  'Overcrowd-30': { ar: 'إزدحام تحذيري (+30)', icon: 'groups', severity: 'warning' },
  'Overcrowd-50': { ar: 'إزدحام حرج (+50)', icon: 'groups', severity: 'critical' },
  'Trip Fall': { ar: 'سقوط / تعثّر', icon: 'personal_injury', severity: 'critical' },
  'Wrong Way': { ar: 'عكس الاتجاه', icon: 'swap_vert', severity: 'critical' },
};
