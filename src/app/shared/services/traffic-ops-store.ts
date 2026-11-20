import { Injectable, computed, signal } from '@angular/core';

export type Period = '1h' | '24h' | '7d';
export type Compare = 'prev-day' | 'prev-week' | 'none';
export type Sev = 'high' | 'mid' | 'low';
export type Tone = 'ok' | 'warn' | 'high' | 'crit' | 'brand' | 'purple';

export interface LiveEvent {
  id: number;
  sev: Sev;
  icon: string;
  title: string;
  place: string;
  zone: string;
  type: string;
  status: string;
  ts: number;
}

/** Event templates the mock live feed draws from (real source: incident system + VISuite). */
const POOL: Omit<LiveEvent, 'id' | 'ts' | 'status'>[] = [
  { sev: 'high', icon: 'car_crash', title: 'حادث مروري', place: 'طريق الملك عبدالعزيز - اتجاه الشمال', zone: 'center', type: 'حادث' },
  { sev: 'high', icon: 'swap_vert', title: 'عكس اتجاه مرصود', place: 'طريق الهجرة - تقاطع الدائري الثاني', zone: 'uyun', type: 'عكس اتجاه' },
  { sev: 'mid', icon: 'traffic', title: 'ازدحام شديد', place: 'طريق الدائري الثاني - جسر قباء', zone: 'quba', type: 'ازدحام' },
  { sev: 'mid', icon: 'local_parking', title: 'وقوف مخالف متكرر', place: 'محيط المسجد النبوي - الساحة الجنوبية', zone: 'center', type: 'وقوف مخالف' },
  { sev: 'mid', icon: 'car_repair', title: 'تعطل مركبة', place: 'طريق المطار - اتجاه المدينة', zone: 'haritha', type: 'حادث' },
  { sev: 'mid', icon: 'engineering', title: 'أعمال صيانة طارئة', place: 'طريق سلطانة - مسار واحد', zone: 'sultana', type: 'أعمال طرق' },
  { sev: 'low', icon: 'block', title: 'إغلاق جزئي', place: 'نفق المسفلة - مسار واحد', zone: 'shuran', type: 'إغلاق' },
  { sev: 'low', icon: 'rainy', title: 'تنبيه جوي', place: 'أمطار خفيفة على شرق المدينة', zone: 'all', type: 'ازدحام' },
];

export const TONE_HEX: Record<Tone, string> = {
  ok: '#00a651',
  warn: '#f5a623',
  high: '#f97316',
  crit: '#e74c3c',
  brand: '#2563eb',
  purple: '#8b5cf6',
};

export const ZONE_OPTIONS = [
  { id: 'all', ar: 'كامل النطاق', factor: 1 },
  { id: 'center', ar: 'المنطقة المركزية', factor: 0.28 },
  { id: 'quba', ar: 'حي قباء', factor: 0.16 },
  { id: 'uyun', ar: 'حي العيون', factor: 0.15 },
  { id: 'aziziyah', ar: 'حي العزيزية', factor: 0.14 },
  { id: 'haritha', ar: 'حي بني حارثة', factor: 0.12 },
  { id: 'sultana', ar: 'حي سلطانة', factor: 0.1 },
  { id: 'shuran', ar: 'حي الشوران', factor: 0.09 },
];
export const PERIOD_OPTIONS: { id: Period; ar: string; mult: number }[] = [
  { id: '1h', ar: 'الوقت الحالي', mult: 0.06 },
  { id: '24h', ar: 'آخر 24 ساعة', mult: 1 },
  { id: '7d', ar: 'آخر 7 أيام', mult: 7 },
];
export const COMPARE_OPTIONS: { id: Compare; ar: string }[] = [
  { id: 'prev-day', ar: 'اليوم المماثل السابق' },
  { id: 'prev-week', ar: 'الأسبوع السابق' },
  { id: 'none', ar: 'بدون مقارنة' },
];

const HOURS = ['21:00', '00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00'];

/**
 * Shared filters + mock data for the Traffic dashboard tabs.
 * Every mock block names its real source (see the integration table in the spec).
 */
@Injectable({ providedIn: 'root' })
export class TrafficOpsStore {
  // ── shared filters (apply to every tab) ──
  readonly zoneId = signal('all');
  readonly period = signal<Period>('1h');
  readonly compare = signal<Compare>('prev-day');

  /** Seconds-resolution clock (drives "منذ X دقيقة" and the blink window). */
  readonly now = signal(Date.now());
  private readonly clock = setInterval(() => this.now.set(Date.now()), 1000);

  /** New events that arrived since the page opened (newest first). Shared by the overview and incidents tabs. */
  readonly liveAdded = signal<LiveEvent[]>([]);
  private nextId = 1;
  private scheduleEvent(): void {
    setTimeout(() => {
      const t = POOL[Math.floor(Math.random() * POOL.length)];
      this.liveAdded.update((l) => [{ ...t, id: this.nextId++, status: 'مفتوح', ts: Date.now() }, ...l].slice(0, 8));
      this.scheduleEvent();
    }, 9000 + Math.random() * 7000);
  }
  /** Ids of events that arrived in the last 7 s → they blink. */
  readonly freshIds = computed(() => new Set(this.liveAdded().filter((e) => this.now() - e.ts < 7000).map((e) => e.id)));
  /** "الآن" / "منذ N دقيقة" for a live event. */
  ago(ts: number): string {
    const m = Math.floor((this.now() - ts) / 60000);
    return m < 1 ? 'الآن' : `منذ ${m} دقيقة`;
  }

  /** Mock live feed: ticks every 12 s so the indicators move like real data (replaced by the API later). */
  private readonly tick = signal(0);
  private readonly timer = setInterval(() => this.tick.update((n) => n + 1), 12_000);
  constructor() {
    this.scheduleEvent();
  }

  /** Large counts drift by about ±1.2 %. */
  live(base: number, seed: number): number {
    return Math.round(base * (1 + Math.sin(this.tick() * 1.7 + seed) * 0.012));
  }
  /** Small counts step up by one now and then. */
  bump(base: number, seed: number): number {
    return base + ((this.tick() + seed) % 4 === 0 ? 1 : 0);
  }

  /** Chart/figure values that wobble ±amp on every tick so charts flash like live data. */
  drift(base: number, seed: number, amp = 0.04): number {
    return Math.round(base * (1 + Math.sin(this.tick() * 1.3 + seed) * amp) * 10) / 10;
  }

  readonly zone = computed(() => ZONE_OPTIONS.find((z) => z.id === this.zoneId()) ?? ZONE_OPTIONS[0]);
  readonly zoneF = computed(() => this.zone().factor);
  readonly showCompare = computed(() => this.compare() !== 'none');
  /** "اليوم السابق" / "الأسبوع السابق" (empty when the comparison is off). */
  readonly compareLabel = computed(() => (this.compare() === 'prev-week' ? 'الأسبوع السابق' : this.compare() === 'prev-day' ? 'اليوم السابق' : ''));
  /** Comparison chip text, e.g. "اليوم السابق +8%"; null when the comparison is off. The figure stays left-to-right inside the Arabic text. */
  chip(figure: string): string | null {
    return this.showCompare() ? `${this.compareLabel()} ⁦${figure}⁩` : null;
  }

  /** Scale by zone only (rates / snapshots). */
  z(base: number, min = 0): number {
    return Math.max(min, Math.round(base * this.zoneF()));
  }

  // ───────── Traffic flow tab (HERE / TomTom / GIS) ─────────
  readonly topCongestedZones = [
    { label: 'حي العزيزية', value: 92 },
    { label: 'حي العيون', value: 88 },
    { label: 'حي شوران', value: 76 },
    { label: 'حي بني حارثة', value: 63 },
    { label: 'حي الجمعة', value: 57 },
  ];

  readonly jamFactor = 0.72;
  readonly capacityUse = 76;
  readonly capacity = 108_000;
  readonly jamMinutes = 34;
  readonly neighborhoods = [
    { label: 'حي قباء', value: 96300 },
    { label: 'حي العزيزية', value: 88420 },
    { label: 'حي العيون', value: 76510 },
    { label: 'حي بني حارثة', value: 64280 },
    { label: 'حي سلطانة', value: 52610 },
  ];

  readonly trafficMap = [
    { x: 24, y: 28, tone: 'crit' as Tone, icon: 'car_crash', label: 'حي العيون (حادث عرضي) · 28 كم/س' },
    { x: 66, y: 26, tone: 'warn' as Tone, icon: 'warning', label: 'طريق سلطانة · 48 كم/س' },
    { x: 78, y: 78, tone: 'high' as Tone, icon: 'warning', label: 'حي العزيزية · 36 كم/س' },
    { x: 38, y: 90, tone: 'crit' as Tone, icon: 'warning', label: 'حي قباء (اختناق مروري) · 23 كم/س' },
  ];

  // ───────── Incidents & operations tab (incident-management system) ─────────
  readonly incidents = computed(() => {
    const p = this.period() === '7d' ? 5 : this.period() === '1h' ? 0.2 : 1;
    const z = Math.max(this.zoneF(), 0.12) * p;
    const r = (v: number, min = 0) => Math.max(min, Math.round(v * z));
    return {
      total: r(36, 1),
      open: r(12, 1),
      critical: r(5, 1),
      closed: r(24, 1),
      late: r(8, 1),
      responseMin: 8.5,
      clearMin: 24,
    };
  });

  readonly reportStatus = computed(() => {
    const z = Math.max(this.zoneF(), 0.1);
    const mk = (name: string, v: number, color: string) => ({ name, y: Math.max(1, Math.round(v * z)), color });
    return [
      mk('جديدة', 18, TONE_HEX.brand),
      mk('تم الإسناد', 26, TONE_HEX.ok),
      mk('قيد المعالجة', 42, TONE_HEX.warn),
      mk('متأخرة', 8, TONE_HEX.crit),
      mk('مغلقة', 54, TONE_HEX.purple),
    ];
  });

  readonly eventTypes = computed(() => {
    const z = Math.max(this.zoneF(), 0.12);
    const mk = (name: string, v: number, color: string) => ({ name, y: Math.max(1, Math.round(v * z)), color });
    return [
      mk('حوادث مرورية', 12, TONE_HEX.brand),
      mk('توقف مخالف', 7, TONE_HEX.ok),
      mk('عكس اتجاه', 5, TONE_HEX.warn),
      mk('عبور مشاة', 4, '#ec4899'),
      mk('أعمال طرق', 3, TONE_HEX.high),
      mk('أخرى', 5, '#94a3b8'),
    ];
  });

  readonly hotspots = [
    { label: 'طريق الملك عبدالعزيز', value: 8 },
    { label: 'طريق إبراهيم الخليل', value: 6 },
    { label: 'طريق مكة - جدة', value: 5 },
    { label: 'منطقة جرول', value: 4 },
    { label: 'طريق المسفلة', value: 3 },
  ];

  readonly opsPerf = {
    labels: ['21:00', '00:00', '03:00', '06:00', '09:00', '12:00', '15:00'],
    response: [9, 10, 11, 9.5, 8, 7.5, 8.5],
    clear: [26, 28, 30, 27, 23, 21, 24],
  };

  readonly eventsByHour = {
    labels: HOURS,
    today: [3, 3, 7, 5, 6, 9, 4, 5],
    prev: [2, 3, 5, 6, 6, 7, 5, 4],
  };

  readonly mapIncidents = [
    { x: 56, y: 36, tone: 'crit' as Tone, icon: 'car_crash', label: 'حادث - الملك عبدالعزيز' },
    { x: 30, y: 54, tone: 'warn' as Tone, icon: 'warning', label: 'ازدحام شديد' },
    { x: 66, y: 72, tone: 'crit' as Tone, icon: 'block', label: 'إغلاق' },
    { x: 46, y: 70, tone: 'brand' as Tone, icon: 'directions_car', label: 'دورية' },
    { x: 76, y: 28, tone: 'warn' as Tone, icon: 'engineering', label: 'أعمال طرق' },
  ];

  // ───────── Cameras tab (Milestone MIP / VISuite) ─────────
  readonly coverage = 98;
  readonly camEventsHourly = {
    labels: HOURS,
    data: [40, 20, 15, 60, 120, 110, 150, 190],
  };
  readonly camMarkers = [
    { x: 50, y: 50, tone: 'ok' as Tone, icon: 'videocam', label: 'الحرم (120)' },
    { x: 30, y: 26, tone: 'ok' as Tone, icon: 'videocam', label: 'حي سلطانة' },
    { x: 46, y: 18, tone: 'ok' as Tone, icon: 'videocam', label: 'حي قباء' },
    { x: 64, y: 24, tone: 'ok' as Tone, icon: 'photo_camera', label: 'الدائري الثاني (38)' },
    { x: 82, y: 48, tone: 'brand' as Tone, icon: 'videocam', label: 'طريق الملك عبدالعزيز (56)' },
    { x: 72, y: 72, tone: 'ok' as Tone, icon: 'videocam', label: 'بني حارثة (98)' },
    { x: 30, y: 72, tone: 'ok' as Tone, icon: 'videocam', label: 'طريق عمر بن الخطاب (42)' },
    { x: 50, y: 90, tone: 'crit' as Tone, icon: 'warning', label: 'تقاطع العزيزية (34)' },
  ];
  readonly camByZone = [
    { label: 'حي الحرم (المركزية)', value: 99, sub: '120 كاميرا' },
    { label: 'حي بني حارثة', value: 97, sub: '98 كاميرا' },
    { label: 'حي العزيزية', value: 96, sub: '86 كاميرا' },
    { label: 'حي العيون', value: 95, sub: '82 كاميرا' },
    { label: 'حي الشوران', value: 94, sub: '78 كاميرا' },
  ];
  // ───────── Forecast tab (prediction model / Esri / NCM / Nusuk) ─────────
  readonly forecast = {
    peaks: [
      { label: 'الذروة الأولى', time: '10:00 - 13:00' },
      { label: 'الذروة الثانية', time: '18:00 - 21:00' },
    ],
    maxJam: 92,
    maxJamPlace: 'محيط المسجد النبوي (الدائري الأول)',
    avgJam: 0.78,
    visitors: 1_250_000,
    visitorsChange: 8,
    eventsImpact: 22,
    accuracy: 94.2,
  };

  readonly dayForecast = [
    { label: 'الثلاثاء', value: 68 },
    { label: 'الأربعاء', value: 72 },
    { label: 'الخميس', value: 83 },
    { label: 'الجمعة', value: 92 },
    { label: 'السبت', value: 80 },
    { label: 'الأحد', value: 64 },
    { label: 'الاثنين', value: 61 },
  ];

  readonly nextHours = {
    labels: ['21:00', '23:00', '01:00', '03:00', '05:00', '07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00'],
    data: [40, 34, 22, 15, 20, 45, 72, 88, 92, 78, 70, 90],
  };

  readonly forecastMap = [
    { x: 23, y: 30, tone: 'crit' as Tone, icon: 'trending_up', label: 'حي سلطانة' },
    { x: 79.5, y: 37.5, tone: 'ok' as Tone, icon: 'trending_up', label: 'حي بني حارثة' },
    { x: 12, y: 56, tone: 'warn' as Tone, icon: 'trending_up', label: 'حي العيون' },
    { x: 49.5, y: 87, tone: 'warn' as Tone, icon: 'trending_up', label: 'حي قباء وممشى قباء' },
    { x: 80, y: 82, tone: 'high' as Tone, icon: 'trending_up', label: 'حي العزيزية' },
  ];

  readonly upcomingEvents = [
    { name: 'ملتقى المدينة المنورة', place: 'مركز الملك سلمان للمؤتمرات', when: '30 يناير', impact: 'high' as Sev, score: 85 },
    { name: 'معرض الحج والعمرة الدولي', place: 'طريق قباء المركزي', when: '1 فبراير', impact: 'mid' as Sev, score: 55 },
    { name: 'فعاليات جادة قباء السياحية', place: 'محيط قباء التاريخي', when: '3 فبراير', impact: 'mid' as Sev, score: 48 },
  ];

  readonly impactFactors = [
    { label: 'الفعاليات والمناسبات الكبرى', value: 38, color: TONE_HEX.brand },
    { label: 'أعداد الزوار والمعتمرين والحافلات', value: 28, color: TONE_HEX.high },
    { label: 'الرحلات الجوية ومحطة قطار الحرمين', value: 15, color: TONE_HEX.purple },
    { label: 'الحالة الجوية ودرجة الحرارة', value: 10, color: TONE_HEX.warn },
    { label: 'أعمال الطرق والصيانة المجدولة', value: 9, color: '#94a3b8' },
  ];

  readonly scenarios = [
    { id: 's1', icon: 'traffic', title: 'ارتفاع الازدحام في محيط النبوي', note: 'احتمالية الحدوث 88% خلال صلاة الجمعة', action: 'تعزيز الفرق الميدانية وتنظيم الإشارات' },
    { id: 's2', icon: 'groups', title: 'زيادة أعداد الزوار (مواسم وفعاليات)', note: 'توقع ارتفاع الطلب على المواقف ومحطات النقل', action: 'تفعيل خطة إدارة الحشود وساحات الحرم' },
    { id: 's3', icon: 'thunderstorm', title: 'أحوال جوية غير مستقرة', note: 'خطر انخفاض الرؤية أو تجمع مياه سطحي', action: 'تجهيز خطط تحويل مرورية احتياطية' },
  ];
  readonly activeScenario = signal('');
  readonly planApproved = signal(false);

  readonly resources = {
    patrolsNeededPct: 12,
    trafficPoints: 24,
    extraPct: 12,
    recommend: 'يوصى ببدء نشر فرق الدعم في محيط الدائري الأول ابتداءً من الساعة 16:30.',
  };
}
