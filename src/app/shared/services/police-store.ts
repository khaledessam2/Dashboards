import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

export type Level = 'ok' | 'warn' | 'bad';
export const LEVEL_HEX: Record<Level, string> = { ok: '#10b981', warn: '#f59e0b', bad: '#e11d48' };

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const levelOf = (density: number): Level => (density > 5 ? 'bad' : density >= 3.5 ? 'warn' : 'ok');

export interface PoliceZone {
  id: string;
  name: string;
  short: string;
  /** Map rectangle. */
  x: number; y: number; w: number; h: number;
  area: number;
  count: number;
  domes?: number;
  dwellMin: number;
}

const ZONES: PoliceZone[] = [
  { id: 'north', name: 'الساحة الشمالية (المظلات)', short: 'الساحة الشمالية', x: 190, y: 18, w: 380, h: 64, area: 56000, count: 156800, dwellMin: 0, domes: 0 },
  { id: 'main', name: 'التوسعة السعودية الأولى والثانية والحرم المدني القديم', short: 'التوسعة السعودية والحرم المدني القديم', x: 190, y: 96, w: 380, h: 172, area: 38000, count: 155800, dwellMin: 9, domes: 27 },
  { id: 'rawdah', name: 'الروضة الشريفة وممر السلام', short: 'الروضة الشريفة وممر السلام', x: 290, y: 188, w: 180, h: 66, area: 700, count: 3850, dwellMin: 19 },
  { id: 'west', name: 'مصلى النساء الغربي', short: 'مصلى النساء الغربي', x: 36, y: 96, w: 128, h: 172, area: 9000, count: 31300, dwellMin: 6 },
  { id: 'east', name: 'الساحة الشرقية (البقيع)', short: 'الساحة الشرقية (البقيع)', x: 596, y: 96, w: 128, h: 172, area: 9000, count: 28800, dwellMin: 7 },
  { id: 'south', name: 'الساحة الجنوبية (مواجهة القبلة وباب قباء)', short: 'الساحة الجنوبية', x: 190, y: 284, w: 380, h: 84, area: 30000, count: 90800, dwellMin: 0 },
];

/** Base occupancy densities (people / m²) the random walk is centred on. */
const BASE_DENSITY: Record<string, number> = { north: 2.8, main: 4.1, rawdah: 5.5, west: 3.5, east: 3.2, south: 3.0 };

export interface GateRow {
  cam: string;
  id: string;
  name: string;
  status: string;
  level: Level;
  queue: number | null;
  rate: number | null;
  action: string;
  detail?: string;
}

export interface SafetyAlert {
  cam: string;
  id: number;
  title: string;
  icon: string;
  ago: string;
  place: string;
  status: string;
  level: Level;
  done: boolean;
}

const PRAYERS: Array<{ ar: string; h: number; m: number }> = [
  { ar: 'الفجر', h: 4, m: 52 }, { ar: 'الظهر', h: 12, m: 8 }, { ar: 'العصر', h: 15, m: 32 },
  { ar: 'المغرب', h: 17, m: 38 }, { ar: 'العشاء', h: 19, m: 8 },
];

@Injectable({ providedIn: 'root' })
export class PoliceStore {
  readonly now = signal(Date.now());
  readonly lastUpdate = signal(Date.now());

  private readonly density = signal<Record<string, number>>({ ...BASE_DENSITY });
  private readonly flow = signal({ inn: 21450, out: 13800 });
  private readonly resp = signal({ review: 16, assign: 29, arrive: 3.4, onTarget: 95.4 });
  private readonly weather = signal({ temp: 29, wind: 12, humidity: 22 });
  private readonly gateDrift = signal({ g1: 390, g1r: 145, g2: 480, g2r: 110, g3: 95, g3r: 230 });
  private readonly sparkSeed = signal([342, 346, 349, 353, 356, 359, 363, 368.4]);
  private readonly series = signal(Array.from({ length: 8 }, (_, i) => ({ inn: 15200 + i * 900 + rnd(-300, 300), out: 11800 + i * 260 + rnd(-300, 300) })));
  private readonly alertState = signal<SafetyAlert[]>([
    { id: 1, cam: '10.0.30.18', title: 'إنذار دخان (FAS)', icon: 'local_fire_department', ago: 'منذ 40 ث', place: 'ممر الأروقة الشرقية - قطاع 4', status: 'بانتظار التحقق المرئي', level: 'bad', done: false },
    { id: 2, cam: '10.0.30.20', title: 'رصد حالة سقوط وتعثر', icon: 'personal_injury', ago: 'منذ 2 د', place: 'الساحة الشمالية - قرب باب الملك فهد 21', status: 'تم التحقق: أُحيل للهلال الأحمر', level: 'warn', done: true },
    { id: 3, cam: '10.0.30.5', title: 'جسم متروك (VISuite)', icon: 'inventory_2', ago: 'منذ 4 د', place: 'الساحة الغربية - مظلة 112', status: 'قيد مراجعة المشغل', level: 'warn', done: false },
    { id: 4, cam: '10.0.30.3', title: 'تكدس عند المخرج', icon: 'groups', ago: 'منذ 6 د', place: 'بوابة السلام - مخرج الروضة', status: 'بانتظار المراجعة', level: 'bad', done: false },
    { id: 5, cam: '10.0.30.22', title: 'دخول منطقة محظورة', icon: 'block', ago: 'منذ 9 د', place: 'مبنى الخدمات المساندة - الباب الخلفي', status: 'بانتظار التحقق', level: 'bad', done: false },
    { id: 6, cam: '10.0.30.10', title: 'مركبة متوقفة في مسار الإسعاف', icon: 'local_shipping', ago: 'منذ 11 د', place: 'محيط مهبط الإسعاف', status: 'قيد مراجعة المشغل', level: 'warn', done: false },
    { id: 7, cam: '10.0.30.1', title: 'بلاغ تائه - طفل', icon: 'child_care', ago: 'منذ 12 د', place: 'الرواق الشمالي - قرب باب 21', status: 'قيد البحث', level: 'warn', done: false },
    { id: 8, cam: '10.0.30.1', title: 'مسار طوارئ محجوب', icon: 'alt_route', ago: 'منذ 14 د', place: 'ممر الطوارئ B - الرواق الشمالي', status: 'قيد المعالجة', level: 'bad', done: false },
    { id: 9, cam: '10.0.30.24', title: 'ازدحام حرج', icon: 'groups', ago: 'منذ 15 د', place: 'الروضة الشريفة وممر السلام', status: 'بانتظار المراجعة', level: 'bad', done: false },
    { id: 10, cam: '10.0.30.18', title: 'تعطل قارئ العد الآلي', icon: 'sensors_off', ago: 'منذ 23 د', place: 'المداخل الشرقية', status: 'قيد الصيانة', level: 'warn', done: false },
    { id: 11, cam: '10.0.30.20', title: 'تعطل مظلة', icon: 'umbrella', ago: 'منذ 28 د', place: 'الرواق الشمالي - مظلة 14', status: 'بانتظار الفني', level: 'warn', done: false },
  ]);

  constructor() {
    const clock = setInterval(() => this.now.set(Date.now()), 1000);
    const drift = setInterval(() => this.step(), 5000);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(clock);
      clearInterval(drift);
    });
  }

  private step(): void {
    this.lastUpdate.set(Date.now());
    this.density.update((d) => Object.fromEntries(Object.entries(d).map(([k, v]) => [k, +clamp(v + rnd(-0.12, 0.12) + (BASE_DENSITY[k] - v) * 0.2, 1.2, 7).toFixed(2)])));
    this.flow.update((f) => ({ inn: Math.round(clamp(f.inn + rnd(-500, 500), 18000, 26000)), out: Math.round(clamp(f.out + rnd(-400, 400), 11000, 17000)) }));
    this.resp.update((r) => ({
      review: Math.round(clamp(r.review + rnd(-1, 1), 10, 24)), assign: Math.round(clamp(r.assign + rnd(-2, 2), 20, 40)),
      arrive: +clamp(r.arrive + rnd(-0.1, 0.1), 2.6, 4.6).toFixed(1), onTarget: +clamp(r.onTarget + rnd(-0.3, 0.3), 92, 98).toFixed(1),
    }));
    this.weather.update((w) => ({ temp: Math.round(clamp(w.temp + rnd(-0.3, 0.3), 26, 34)), wind: Math.round(clamp(w.wind + rnd(-1, 1), 6, 22)), humidity: Math.round(clamp(w.humidity + rnd(-1, 1), 15, 35)) }));
    this.gateDrift.update((g) => ({
      g1: Math.round(clamp(g.g1 + rnd(-20, 20), 250, 520)), g1r: Math.round(clamp(g.g1r + rnd(-6, 6), 110, 180)),
      g2: Math.round(clamp(g.g2 + rnd(-25, 25), 300, 620)), g2r: Math.round(clamp(g.g2r + rnd(-6, 6), 80, 140)),
      g3: Math.round(clamp(g.g3 + rnd(-10, 10), 40, 160)), g3r: Math.round(clamp(g.g3r + rnd(-8, 8), 180, 280)),
    }));
    this.sparkSeed.update((s) => [...s.slice(1), +clamp(s[s.length - 1] + rnd(-1.5, 2.2), 330, 480).toFixed(1)]);
    this.series.update((s) => [...s.slice(1), { inn: this.flow().inn, out: this.flow().out }]);
  }

  readonly zones = computed(() => {
    const d = this.density();
    return ZONES.map((z) => {
      const density = d[z.id];
      const count = Math.round(density * z.area);
      return { ...z, density, count, level: levelOf(density) };
    });
  });

  readonly zoneRows = computed(() => this.zones().map((z) => {
    const maxD = z.id === 'rawdah' ? 6 : 5;
    const occ = Math.min(Math.round((z.density / maxD) * 100), 100);
    return { ...z, occ };
  }));

  readonly total = computed(() => {
    const sum = Object.values(this.density()).reduce((s, v) => s + v, 0);
    const base = Object.values(BASE_DENSITY).reduce((s, v) => s + v, 0);
    return Math.round((368_400 * sum) / base);
  });
  readonly capacity = 500_000;
  readonly occupancyPct = computed(() => Math.round((this.total() / this.capacity) * 100));
  readonly spark = this.sparkSeed;
  readonly hourDelta = 5.1;

  readonly flowNow = computed(() => ({ inn: this.flow().inn, out: this.flow().out, net: this.flow().inn - this.flow().out }));

  readonly flowSeries = computed(() => {
    const s = this.series();
    const t = new Date(this.now());
    t.setSeconds(0, 0);
    t.setMinutes(Math.floor(t.getMinutes() / 15) * 15);
    return s.map((p, i) => {
      const d = new Date(t.getTime() - (s.length - 1 - i) * 15 * 60_000);
      return { label: i === s.length - 1 ? 'الآن' : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`, inn: Math.round(p.inn), out: Math.round(p.out) };
    });
  });

  readonly crowdAlerts = computed(() => {
    const z = this.zones();
    const crit = z.filter((r) => r.level === 'bad');
    const warn = z.filter((r) => r.level === 'warn');
    const top = [...z].sort((a, b) => b.density - a.density)[0];
    return { crit: crit.length, warn: warn.length, top };
  });

  readonly gateSummary = computed(() => ({ open: 96, busy: 4, closed: 2 }));

  readonly gates = computed<GateRow[]>(() => {
    const g = this.gateDrift();
    return [
      { id: 'g1', cam: '10.0.30.3', name: 'باب السلام (1) - مسار الروضة', status: g.g1 >= 500 ? 'تكدس حرج' : 'تكدس تحذيري', level: g.g1 >= 500 ? 'bad' : 'warn', queue: g.g1, rate: g.g1r, action: 'فحص الباب' },
      { id: 'g2', cam: '10.0.30.18', name: 'باب البقيع (مخرج الروضة)', status: 'تكدس خروج (د12)', level: 'bad', queue: g.g2, rate: g.g2r, action: 'فتح مسار مساند' },
      { id: 'g3', cam: '10.0.30.12', name: 'باب الملك فهد (21) - الشمال', status: 'سالك - طبيعي', level: 'ok', queue: g.g3, rate: g.g3r, action: 'فحص الباب' },
      { id: 'g4', cam: '10.0.30.22', name: 'ممر الطوارئ الشرقي (مواجهة البقيع)', status: 'محجوب بعربات (د5)', level: 'bad', queue: null, rate: null, action: 'كاميرا الممر', detail: 'مسار طوارئ · قيد الإخلاء الميداني' },
    ];
  });

  readonly alerts = this.alertState;
  readonly pendingAlerts = computed(() => this.alertState().filter((a) => !a.done).length);

  readonly missing = { lostOpen: 11, notResolvedToday: 29, helpUnanswered: 1, helpWaitSec: 22 };

  readonly response = computed(() => ({
    ...this.resp(),
    critical: 3,
    badges: [{ n: 1, ar: 'إنذار حريق' }, { n: 2, ar: 'إسعاف / إجهاد' }],
    delayed: 1,
    unassigned: 1,
    cases: [
      { id: 'INC-412', title: 'إجهاد لكبير سن', place: 'الساحة الجنوبية - مقابل باب قباء (5)', tag: 'حالة مشتركة', level: 'warn' as Level,
        parties: [{ ar: 'أمن المسجد النبوي', st: 'جاهز', ok: true }, { ar: 'الهلال الأحمر', st: 'في الطريق (د1)', ok: false }], wait: '', action: '' },
      { id: 'INC-415', title: 'بلاغ 911 لم يُسند', place: 'كثافة حالات معتمرين - تقاطع طريق السلام وطريق الملك فيصل', tag: '', level: 'bad' as Level,
        parties: [{ ar: 'الجهة المقترحة: مرور المدينة', st: '', ok: false }], wait: '01:30 انتظار', action: 'إسناد فوري' },
    ],
  }));

  readonly weatherNow = computed(() => ({ ...this.weather(), vis: 10 }));

  readonly nextPrayer = computed(() => {
    const d = new Date(this.now());
    const nowSec = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
    const list = PRAYERS.map((p) => ({ ...p, diff: (((p.h * 3600 + p.m * 60 - nowSec) % 86400) + 86400) % 86400 }));
    const next = list.reduce((a, b) => (b.diff < a.diff ? b : a));
    const p = (n: number) => String(n).padStart(2, '0');
    return { ar: next.ar, countdown: `${p(Math.floor(next.diff / 3600))}:${p(Math.floor((next.diff % 3600) / 60))}:${p(next.diff % 60)}`, minutes: Math.floor(next.diff / 60) };
  });

  readonly umbrellas = { open: 246, maintenance: 4, domesClosed: 25, domesMoving: 2, domesTotal: 27 };
  readonly visit = { title: 'زيارة وفد رسمي (الروضة الشريفة)', from: '17:15', to: '18:15', gate: 'باب الملك عبدالعزيز (34)' };

  readonly waves = computed(() => ({
    peak: '18:00',
    rows: [
      { time: '20:00', train: 1100, air: 2100 },
      { time: '19:00', train: 1900, air: 2800 },
      { time: '18:00', train: 2700, air: 4200 },
      { time: '17:00', train: 1500, air: 2300 },
    ],
  }));
}
