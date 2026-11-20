import { PoliceEventName } from '../models/police.model';

/** KPI-Documentation §3.6 — event types tracked by the police videowall. */
export const POLICE_EVENT_META: Record<PoliceEventName, { ar: string; icon: string; severity: 'critical' | 'warning' }> = {
  'Restricted Area Entry': { ar: 'دخول منطقة محظورة', icon: 'block', severity: 'critical' },
  'Left Object': { ar: 'جسم متروك', icon: 'inventory_2', severity: 'critical' },
  'Overcrowd-30': { ar: 'إزدحام تحذيري (+30)', icon: 'groups', severity: 'warning' },
  'Overcrowd-50': { ar: 'إزدحام حرج (+50)', icon: 'groups', severity: 'critical' },
  'Trip Fall': { ar: 'سقوط / تعثّر', icon: 'personal_injury', severity: 'critical' },
};

/** Where each camera is installed (shown next to the camera id). */
export const CAMERA_PLACES: Record<string, string> = {
  '10.0.30.1': 'الرواق الشمالي',
  '10.0.30.3': 'بوابة السلام',
  '10.0.30.5': 'الساحة الغربية',
  '10.0.30.7': 'الساحة الغربية',
  '10.0.30.9': 'المداخل الغربية',
  '10.0.30.10': 'محيط مهبط الإسعاف',
  '10.0.30.12': 'بوابة الملك فهد',
  '10.0.30.14': 'مواقف السيارات',
  '10.0.30.16': 'الساحة الجنوبية',
  '10.0.30.18': 'المداخل الشرقية',
  '10.0.30.20': 'الساحة الشمالية',
  '10.0.30.21': 'المدخل الخلفي',
  '10.0.30.22': 'مبنى الخدمات المساندة',
  '10.0.30.24': 'المنطقة المركزية',
  '10.0.30.26': 'المدخل الشمالي',
};

/** "كاميرا 03" → "CAM-03". */
export const camId = (name: string): string => `CAM-${name.replace(/\D/g, '').padStart(2, '0')}`;
