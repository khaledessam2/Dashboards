import { Injectable, computed, inject, signal } from '@angular/core';
import { changePercent } from '../utils/police.utils';
import { CAMERA_PLACES, POLICE_EVENT_META, camId } from '../constants/police.constants';
import { Camera, CamerasService } from './cameras.service';
import { CameraSeries, HourBucket, PoliceEvent, PoliceEventName, ZoneStat } from '../models/police.model';
import { formatHour12 } from '../utils/time.utils';

const HOUR = 3_600_000;
const FRESH_MS = 7_000; // how long a new event / map marker stays highlighted
const FEED_SIZE = 15;
const CAMERA_LOAD = 0.7; // police events per camera relative to the traffic mock volume

/** Weighted pick — restricted entries and crowd warnings are the most frequent. */
const EVENT_WEIGHTS: Array<[PoliceEventName, number]> = [
  ['Restricted Area Entry', 0.28],
  ['Overcrowd-30', 0.3],
  ['Trip Fall', 0.17],
  ['Left Object', 0.15],
  ['Overcrowd-50', 0.1],
];

const ZONES: ZoneStat[] = [
  { ar: 'دخول الحرم', value: 59618 },
  { ar: 'ساحة المنطقة المركزية', value: 52765 },
  { ar: 'المداخل الشرقية', value: 47658 },
  { ar: 'المنطقة الغربية', value: 42774 },
  { ar: 'الساحة الشمالية', value: 36356 },
];

/** #16 — busiest zones by tracked movement. */
const MOVE_ZONES: ZoneStat[] = [
  { ar: 'المنطقة المركزية', value: 43762 },
  { ar: 'المداخل الرئيسية', value: 36411 },
  { ar: 'المنطقة الشرقية', value: 28905 },
  { ar: 'المنطقة الغربية', value: 24118 },
  { ar: 'الساحة الشمالية', value: 19504 },
];

export const ZONE_OPTIONS = [
  { id: 'all', ar: 'جميع المناطق (المنطقة المركزية والحرم)', ips: [] as string[] },
  { id: 'north', ar: 'المنطقة الشمالية', ips: ['10.0.30.1', '10.0.30.12', '10.0.30.20', '10.0.30.22', '10.0.30.26'] },
  { id: 'west', ar: 'المنطقة الغربية', ips: ['10.0.30.5', '10.0.30.7', '10.0.30.9', '10.0.30.10'] },
  { id: 'central', ar: 'المنطقة المركزية والشرقية', ips: ['10.0.30.3', '10.0.30.14', '10.0.30.16', '10.0.30.18', '10.0.30.21', '10.0.30.24'] },
];

export const TYPE_OPTIONS: Array<{ id: string; ar: string; names: PoliceEventName[] }> = [
  { id: 'all', ar: 'جميع التصنيفات', names: [] },
  { id: 'restricted', ar: 'اختراق مناطق', names: ['Restricted Area Entry'] },
  { id: 'crowd', ar: 'ازدحام وتجمع', names: ['Overcrowd-30', 'Overcrowd-50'] },
  { id: 'leftobj', ar: 'أجسام متروكة', names: ['Left Object'] },
  { id: 'tripfall', ar: 'سقوط وتعثر', names: ['Trip Fall'] },
];

export const SEVERITY_OPTIONS = [
  { id: 'all', ar: 'الكل' },
  { id: 'critical', ar: 'حرج' },
  { id: 'warning', ar: 'تحذيري' },
];

export type PeriodId = 'day' | 'week' | 'month' | 'custom';
export const PERIOD_OPTIONS: Array<{ id: PeriodId; ar: string }> = [
  { id: 'day', ar: 'آخر 24 ساعة' },
  { id: 'week', ar: 'الأسبوع' },
  { id: 'month', ar: 'الشهر' },
  { id: 'custom', ar: 'مخصص' },
];
const DAY = 24 * HOUR;
/** History kept in memory: a 30-day window plus the 30 days before it (for the comparison). */
const HISTORY_DAYS = 60;
const MAX_CUSTOM_DAYS = 30;
const isoDay = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const parseDay = (v: string) => {
  const [y, m, d] = v.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
};

const startOfDay = (ms: number) => new Date(new Date(ms).setHours(0, 0, 0, 0)).getTime();
const sameSet = (a: Set<unknown>, b: Set<unknown>) => a.size === b.size && [...a].every((x) => b.has(x));

function pickEventName(): PoliceEventName {
  let r = Math.random();
  for (const [name, w] of EVENT_WEIGHTS) {
    if ((r -= w) < 0) return name;
  }
  return EVENT_WEIGHTS[0][0];
}

@Injectable({ providedIn: 'root' })
export class PoliceStore {
  private readonly cameras = inject(CamerasService).cameras();
  private nextId = 1;

  /** Ticks every second. */
  readonly now = signal(Date.now());
  readonly lastUpdate = signal(Date.now());
  private readonly allEvents = signal<PoliceEvent[]>([]);
  readonly zones = signal<ZoneStat[]>(ZONES);
  readonly moveZones = signal<ZoneStat[]>(MOVE_ZONES);

  /** Mock (VISuite AI Classifier / People Counter): detected objects by class. */
  readonly objects = signal({ persons: 9776, vehicles: 2958, other: 130 });
  /** Mock (Milestone System Monitor): camera connectivity. */
  readonly cameraLink = signal({ total: 700, online: 672 });
  /** Mock (Milestone / Windows monitoring): infrastructure health. */
  readonly infra = signal({ bandwidthGbps: 1.2, cpu: 54, ram: 68, storageFreeTb: 12.4, storageTotalTb: 24, retentionDays: 32, edgeUptime: 99.98 });
  /** Mock: composite scenarios + mean event duration (minutes). */
  readonly scenario = signal({ composite: 37, avgMinutes: 2.4 });
  /** Mock: % change vs the previous period for the extra tiles. */
  readonly extraChange = signal({ total: 8, persons: 6, cameras: 2, composite: 32, avgMinutes: -9 });
  /** Mock: % change vs the previous day per KPI (real source: ES, previous day). */
  private readonly mockChange = signal({ total: 8, restricted: 34, leftobj: -6, overcrowd50: 12, overcrowd30: 5, tripfall: -9, loitering: 10, intrusion: 25, queue: -4, stationary: 7 });

  /** Phase 1 VISuite rules (mock until the API supplies them). */
  readonly extra = signal({ loitering: 14, intrusion: 5, queue: 7, stationary: 9 });

  /** Selected period (آخر 24 ساعة / الأسبوع / الشهر / مخصص). */
  readonly period = signal<PeriodId>('day');
  readonly customRange = signal({ from: isoDay(Date.now() - 6 * DAY), to: isoDay(Date.now()) });

  setPeriod(id: PeriodId): void {
    this.period.set(id);
  }

  setCustom(key: 'from' | 'to', value: string): void {
    if (value) this.customRange.update((r) => ({ ...r, [key]: value }));
  }

  /** Time window of the selected period: [start, end), split in `count` buckets of `bucket` ms. */
  readonly range = computed(() => {
    const now = this.now();
    const today = startOfDay(now);
    const id = this.period();
    if (id === 'day') {
      const start = Math.floor(now / HOUR) * HOUR - 23 * HOUR;
      return { start, end: start + DAY, bucket: HOUR, count: 24, hourly: true };
    }
    if (id === 'week') return { start: today - 6 * DAY, end: today + DAY, bucket: DAY, count: 7, hourly: false };
    if (id === 'month') return { start: today - 29 * DAY, end: today + DAY, bucket: DAY, count: 30, hourly: false };
    const r = this.customRange();
    let from = parseDay(r.from);
    let to = parseDay(r.to);
    if (to < from) [from, to] = [to, from];
    to = Math.min(to, today);
    from = Math.max(from, to - (MAX_CUSTOM_DAYS - 1) * DAY, today - (HISTORY_DAYS - 1) * DAY);
    const days = Math.round((to - from) / DAY) + 1;
    return days === 1
      ? { start: from, end: from + DAY, bucket: HOUR, count: 24, hourly: true }
      : { start: from, end: to + DAY, bucket: DAY, count: days, hourly: false };
  }, { equal: (a, b) => a.start === b.start && a.end === b.end && a.count === b.count });
  /** Length of the window in days (≥ 1): scales the mock counters that have no history. */
  private readonly days = computed(() => Math.max(1, Math.round((this.range().end - this.range().start) / DAY)));

  /** Dashboard filters (zone / camera / event type / severity). */
  readonly filters = signal({ zone: 'all', camera: 'all', type: 'all', severity: 'all' });
  readonly cameraOptions = this.cameras.map((c) => ({ ip: c.ip, ar: `${camId(c.name)} (${CAMERA_PLACES[c.ip] ?? ''})` }));
  readonly filtersActive = computed(() => Object.values(this.filters()).some((v) => v !== 'all'));

  setFilter(key: 'zone' | 'camera' | 'type' | 'severity', value: string): void {
    this.filters.update((f) => ({ ...f, [key]: value }));
  }

  private readonly matches = computed(() => {
    const f = this.filters();
    const zoneIps = ZONE_OPTIONS.find((z) => z.id === f.zone)?.ips ?? [];
    const names = TYPE_OPTIONS.find((t) => t.id === f.type)?.names ?? [];
    return (e: PoliceEvent) =>
      (!zoneIps.length || zoneIps.includes(e.camera_id)) &&
      (f.camera === 'all' || e.camera_id === f.camera) &&
      (!names.length || names.includes(e.event_name)) &&
      (f.severity === 'all' || POLICE_EVENT_META[e.event_name].severity === f.severity);
  });
  private readonly filtered = computed(() => this.allEvents().filter(this.matches()));
  private readonly inWindow = computed(() => {
    const { start, end } = this.range();
    return this.filtered().filter((e) => e.event_time >= start && e.event_time < end);
  });
  private readonly inPrevious = computed(() => {
    const { start, end } = this.range();
    const len = end - start;
    return this.filtered().filter((e) => e.event_time >= start - len && e.event_time < start);
  });

  /** KPI-Documentation §3.1 — total = restricted + leftobj + overcrowd30 + overcrowd50 + tripfall. */
  readonly kpis = computed(() => this.countKpis(this.inWindow()));
  private readonly previousKpis = computed(() => this.countKpis(this.inPrevious()));

  /** % change vs the previous equal period: real for event-based KPIs, mock for the Phase 1 counters. */
  readonly kpiChange = computed(() => {
    const cur = this.kpis();
    const prev = this.previousKpis();
    const pct = (a: number, b: number) => Math.round(changePercent(a, b));
    return {
      ...this.mockChange(),
      total: pct(cur.total, prev.total),
      restricted: pct(cur.restricted, prev.restricted),
      leftobj: pct(cur.leftobj, prev.leftobj),
      overcrowd50: pct(cur.overcrowd50, prev.overcrowd50),
      overcrowd30: pct(cur.overcrowd30, prev.overcrowd30),
      tripfall: pct(cur.tripfall, prev.tripfall),
    };
  });

  /** Phase 1 counters scaled to the window length (mock until the API supplies history). */
  readonly extraScaled = computed(() => {
    const e = this.extra();
    const n = this.days();
    return { loitering: e.loitering * n, intrusion: e.intrusion * n, queue: e.queue * n, stationary: e.stationary * n };
  });

  private countKpis(list: PoliceEvent[]) {
    const count = (...names: PoliceEventName[]) => list.filter((e) => names.includes(e.event_name)).length;
    const restricted = count('Restricted Area Entry');
    const leftobj = count('Left Object');
    const overcrowd30 = count('Overcrowd-30');
    const overcrowd50 = count('Overcrowd-50');
    const tripfall = count('Trip Fall');
    return { total: restricted + leftobj + overcrowd30 + overcrowd50 + tripfall, restricted, leftobj, overcrowd50, overcrowd30, tripfall };
  }

  /** Headline total: the five core event types plus the Phase 1 rules (intrusion, queues). */
  readonly totalAll = computed(() => this.kpis().total + (this.filtersActive() ? 0 : this.extraScaled().intrusion + this.extraScaled().queue));

  /** #12 — events by type with count + share. */
  readonly byType = computed(() => {
    const k = this.kpis();
    const x = this.extraScaled();
    const rows = [
      { name: 'اختراق مناطق', y: k.restricted, color: '#e11d48' },
      { name: 'ازدحام وتجمع', y: k.overcrowd30 + k.overcrowd50, color: '#0b5cff' },
      { name: 'أجسام متروكة', y: k.leftobj, color: '#f59e0b' },
      { name: 'اقتحام خارج الأوقات', y: this.filtersActive() ? 0 : x.intrusion, color: '#8b5cf6' },
      { name: 'طوابير / تجاوز', y: this.filtersActive() ? 0 : x.queue, color: '#14b8a6' },
      { name: 'سقوط وتعثر', y: k.tripfall, color: '#94a3b8' },
    ];
    const total = rows.reduce((a, r) => a + r.y, 0) || 1;
    return rows.map((r) => ({ ...r, pct: Math.round((r.y / total) * 100) }));
  });

  /** #22 — cameras ranked by events in the window. */
  readonly topCameras = computed(() => {
    const counts = new Map<string, { name: string; place: string; count: number }>();
    for (const e of this.inWindow()) {
      const row = counts.get(e.camera_id) ?? { name: camId(e.camera_name), place: CAMERA_PLACES[e.camera_id] ?? '', count: 0 };
      row.count++;
      counts.set(e.camera_id, row);
    }
    return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 5);
  });

  /** #25 — security events in the selected window vs the previous equal window. */
  readonly incident = computed(() => ({
    current: this.inWindow().length,
    previous: this.inPrevious().length,
  }));

  readonly timeline = computed<HourBucket[]>(() => {
    const { start, bucket, count, hourly } = this.range();
    const counts = new Array<number>(count).fill(0);
    for (const e of this.inWindow()) counts[Math.min(count - 1, Math.floor((e.event_time - start) / bucket))]++;
    const day = new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'numeric' });
    return counts.map((c, i) => ({ label: hourly ? formatHour12(start + i * bucket) : day.format(start + i * bucket), count: c }));
  });

  /** Top 5 cameras with their hourly counts. */
  readonly cameraSeries = computed<CameraSeries[]>(() => {
    const { start, bucket, count } = this.range();
    const rows = new Map<string, number[]>();
    for (const e of this.inWindow()) {
      const row = rows.get(e.camera_name) ?? new Array<number>(count).fill(0);
      row[Math.min(count - 1, Math.floor((e.event_time - start) / bucket))]++;
      rows.set(e.camera_name, row);
    }
    return [...rows]
      .map(([name, data]) => ({ name, data, total: data.reduce((a, b) => a + b, 0) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  });

  /** Live feed: newest first. */
  readonly events = computed(() => this.filtered().slice(-FEED_SIZE).reverse());

  private readonly freshEvents = computed(() => this.events().filter((e) => this.now() - e.event_time < FRESH_MS));
  readonly freshEventIds = computed(() => new Set(this.freshEvents().map((e) => e.id)), { equal: sameSet });
  readonly freshCameraIds = computed(() => new Set(this.freshEvents().map((e) => e.camera_id)), { equal: sameSet });

  constructor() {
    const now = Date.now();
    const from = now - HISTORY_DAYS * DAY;
    this.allEvents.set(
      this.cameras
        .flatMap((cam) => Array.from({ length: Math.round(cam.events24h * CAMERA_LOAD * HISTORY_DAYS) }, () => this.makeEvent(cam, from + Math.random() * (now - from))))
        .sort((a, b) => a.event_time - b.event_time),
    );

    setInterval(() => this.now.set(Date.now()), 1000);
    this.scheduleLiveEvent();
    setInterval(() => this.drift(), 10_000);
  }

  private makeEvent(cam: Camera, time: number): PoliceEvent {
    return { id: this.nextId++, event_name: pickEventName(), camera_id: cam.ip, camera_name: cam.name, event_time: time };
  }

  // A new event every 4–12 s on a random active camera (silent cameras never fire).
  private scheduleLiveEvent(): void {
    setTimeout(() => {
      const active = this.cameras.filter((c) => c.events24h > 0);
      const cam = active[Math.floor(Math.random() * active.length)];
      const keepFrom = Date.now() - HISTORY_DAYS * DAY;
      this.allEvents.update((list) => [...list.filter((e) => e.event_time >= keepFrom), this.makeEvent(cam, Date.now())]);
      this.scheduleLiveEvent();
    }, 4000 + Math.random() * 8000);
  }

  private drift(): void {
    this.lastUpdate.set(Date.now());
    const bump = (v: number, chance: number) => (Math.random() < chance ? v + 1 : v);
    this.extra.update((e) => ({
      loitering: bump(e.loitering, 0.4),
      intrusion: bump(e.intrusion, 0.1),
      queue: bump(e.queue, 0.25),
      stationary: bump(e.stationary, 0.3),
    }));
    this.objects.update((o) => ({ persons: o.persons + Math.round(Math.random() * 12), vehicles: o.vehicles + Math.round(Math.random() * 4), other: o.other + (Math.random() < 0.1 ? 1 : 0) }));
    this.infra.update((i) => ({
      ...i,
      bandwidthGbps: +Math.min(2, Math.max(0.8, i.bandwidthGbps + (Math.random() - 0.5) * 0.1)).toFixed(1),
      cpu: Math.min(90, Math.max(35, i.cpu + Math.round((Math.random() - 0.5) * 4))),
      ram: Math.min(90, Math.max(50, i.ram + Math.round((Math.random() - 0.5) * 3))),
    }));
    this.moveZones.update((zones) => zones.map((z) => ({ ...z, value: z.value + Math.round(Math.random() * 90) })).sort((a, b) => b.value - a.value));
    this.zones.update((zones) => zones.map((z) => ({ ...z, value: z.value + Math.round(Math.random() * 120) })).sort((a, b) => b.value - a.value));
  }
}
