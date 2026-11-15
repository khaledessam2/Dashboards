export type LampStatus = 'on' | 'on-alert' | 'off' | 'off-alert' | 'nodata';
export type LampMode = 'lux' | 'astro' | 'manual' | 'factory';
export type AlertKey = 'loadFail' | 'mainFail' | 'partial' | 'luxBlocked' | 'intermittent' | 'major';

export interface Lamp {
  id: string;
  name: string;
  lat: number;
  lon: number;
  status: LampStatus;
  mode: LampMode;
  alert?: AlertKey;
}

export interface LocationStat {
  ar: string;
  value: number;
}

export const STATUS_META: Record<LampStatus, { ar: string; color: string }> = {
  on: { ar: 'تعمل', color: '#00a651' },
  'on-alert': { ar: 'تعمل مع تنبيه', color: '#f5a623' },
  off: { ar: 'مطفأة', color: '#94a3b8' },
  'off-alert': { ar: 'مطفأة مع تنبيه', color: '#e74c3c' },
  nodata: { ar: 'بدون بيانات', color: '#5b6abf' },
};

export const ALERT_META: Record<AlertKey, { ar: string; color: string }> = {
  loadFail: { ar: 'فشل الحمل', color: '#f5a623' },
  mainFail: { ar: 'انقطاع التغذية', color: '#f5a623' },
  partial: { ar: 'عطل جزئي', color: '#f5a623' },
  luxBlocked: { ar: 'حساس الإضاءة محجوب', color: '#f5a623' },
  intermittent: { ar: 'تشغيل متقطع', color: '#d97706' },
  major: { ar: 'عطل جسيم', color: '#e74c3c' },
};

export const MODE_META: Record<LampMode, { ar: string }> = {
  lux: { ar: 'وضع الإضاءة (Lux)' },
  astro: { ar: 'التقويم الفلكي' },
  manual: { ar: 'وضع يدوي' },
  factory: { ar: 'وضع المصنع' },
};

export const ALERT_KEYS = Object.keys(ALERT_META) as AlertKey[];
export const MODE_KEYS = Object.keys(MODE_META) as LampMode[];
