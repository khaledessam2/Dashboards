import { Injectable, computed, inject, signal } from '@angular/core';
import { Camera, CamerasService } from './cameras.service';
import { CameraSeries, HourBucket, PoliceEvent, PoliceEventName, ZoneStat } from '../models/police.model';

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
  { ar: 'دخول الحرم', value: 41210 },
  { ar: 'عداد 103', value: 33480 },
  { ar: 'خروج الحرم', value: 29760 },
  { ar: 'عداد 106', value: 24120 },
  { ar: 'ازدحام المنطقة أ', value: 17350 },
  { ar: 'ازدحام المنطقة ب', value: 12980 },
];

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
  private readonly allEvents = signal<PoliceEvent[]>([]);
  readonly zones = signal<ZoneStat[]>(ZONES);
  /** Mock: breaches in the full previous day (real source: ES, previous day). */
  readonly breachesYesterday = signal(118);

  private readonly windowStart = computed(() => Math.floor(this.now() / HOUR) * HOUR - 23 * HOUR);
  private readonly inWindow = computed(() => this.allEvents().filter((e) => e.event_time >= this.windowStart()));

  /** KPI-Documentation §3.1 — total = restricted + leftobj + overcrowd30 + overcrowd50 + tripfall. */
  readonly kpis = computed(() => {
    const count = (...names: PoliceEventName[]) => this.inWindow().filter((e) => names.includes(e.event_name)).length;
    const restricted = count('Restricted Area Entry');
    const leftobj = count('Left Object');
    const overcrowd30 = count('Overcrowd-30');
    const overcrowd50 = count('Overcrowd-50');
    const tripfall = count('Trip Fall');
    return { total: restricted + leftobj + overcrowd30 + overcrowd50 + tripfall, restricted, leftobj, overcrowd50, overcrowd30, tripfall };
  });

  /** §3.2.1 — security events in the last 60 min vs 60–120 min ago. */
  readonly incident = computed(() => {
    const now = this.now();
    const security = this.allEvents().filter((e) => e.event_name !== 'Wrong Way');
    const current = security.filter((e) => e.event_time > now - HOUR).length;
    const previous = security.filter((e) => e.event_time <= now - HOUR && e.event_time > now - 2 * HOUR).length;
    return { current, previous };
  });

  /** §3.2.2 — restricted area breaches since midnight vs the full previous day. */
  readonly breach = computed(() => {
    const midnight = startOfDay(this.now());
    const current = this.allEvents().filter((e) => e.event_name === 'Restricted Area Entry' && e.event_time >= midnight).length;
    return { current, previous: this.breachesYesterday() };
  });

  readonly hourly = computed<HourBucket[]>(() => {
    const start = this.windowStart();
    const counts = new Array<number>(24).fill(0);
    for (const e of this.inWindow()) counts[Math.floor((e.event_time - start) / HOUR)]++;
    return counts.map((count, i) => ({ label: `${String(new Date(start + i * HOUR).getHours()).padStart(2, '0')}:00`, count }));
  });

  /** §3.4 — hour with the highest count. */
  readonly peakHour = computed(() => {
    const buckets = this.hourly();
    const best = buckets.reduce((a, b) => (b.count > a.count ? b : a), buckets[0]);
    return best.count > 0 ? best : null;
  });

  /** Top 5 cameras with their hourly counts. */
  readonly cameraSeries = computed<CameraSeries[]>(() => {
    const start = this.windowStart();
    const rows = new Map<string, number[]>();
    for (const e of this.inWindow()) {
      const row = rows.get(e.camera_name) ?? new Array<number>(24).fill(0);
      row[Math.floor((e.event_time - start) / HOUR)]++;
      rows.set(e.camera_name, row);
    }
    return [...rows]
      .map(([name, data]) => ({ name, data, total: data.reduce((a, b) => a + b, 0) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  });

  /** Live feed: newest first. */
  readonly events = computed(() => this.allEvents().slice(-FEED_SIZE).reverse());

  private readonly freshEvents = computed(() => this.events().filter((e) => this.now() - e.event_time < FRESH_MS));
  readonly freshEventIds = computed(() => new Set(this.freshEvents().map((e) => e.id)), { equal: sameSet });
  readonly freshCameraIds = computed(() => new Set(this.freshEvents().map((e) => e.camera_id)), { equal: sameSet });

  constructor() {
    const now = Date.now();
    const from = this.windowStart();
    this.allEvents.set(
      this.cameras
        .flatMap((cam) => Array.from({ length: Math.round(cam.events24h * CAMERA_LOAD) }, () => this.makeEvent(cam, from + Math.random() * (now - from))))
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
      // keep the previous day's events too: breach "today" needs everything since midnight
      const keepFrom = Math.min(this.windowStart(), startOfDay(Date.now()));
      this.allEvents.update((list) => [...list.filter((e) => e.event_time >= keepFrom), this.makeEvent(cam, Date.now())]);
      this.scheduleLiveEvent();
    }, 4000 + Math.random() * 8000);
  }

  private drift(): void {
    this.zones.update((zones) => zones.map((z) => ({ ...z, value: z.value + Math.round(Math.random() * 120) })).sort((a, b) => b.value - a.value));
  }
}
