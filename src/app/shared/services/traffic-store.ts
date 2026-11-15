import { Injectable, computed, inject, signal } from '@angular/core';
import { Camera, CamerasService } from './cameras.service';
import { EventName, TrafficEvent } from '../models/traffic-event.model';
import { CameraSeries, FlowStats, HourBucket, ZoneStat } from '../models/traffic-stats.model';
import { formatHour12 } from '../utils/time.utils';

const HOUR = 3_600_000; // 1 hour => 3600000 ms
const FRESH_MS = 7_000; // how long a new event / map marker stays highlighted
const FEED_SIZE = 15; // Live Feed => last 15 event

const EVENT_NAMES: EventName[] = [
  'Crosswalk Violation',
  'Wrong Way',
  'Parking Overstay',
  'Illegal Taxi',
  'Road Congestion',
  'Flyover Congestion',
];

const ZONES: ZoneStat[] = [
  { ar: 'عداد 103', value: 38420 },
  { ar: 'دخول الحرم', value: 31870 },
  { ar: 'عداد 106', value: 29310 },
  { ar: 'خروج الحرم', value: 27045 },
  { ar: 'ازدحام المنطقة أ', value: 19660 },
  { ar: 'ازدحام المنطقة ب', value: 15230 },
];

const sameSet = (a: Set<unknown>, b: Set<unknown>) => a.size === b.size && [...a].every((x) => b.has(x));

@Injectable({ providedIn: 'root' })

export class TrafficStore {
  private readonly cameras = inject(CamerasService).cameras();
  private nextId = 1;
  // Ticks every second.
  readonly now = signal(Date.now());
  readonly lastUpdate = signal(Date.now());
  private readonly allEvents = signal<TrafficEvent[]>([]);
  readonly flow = signal<FlowStats>({ entry: 2140, exit: 1495 });
  readonly zones = signal<ZoneStat[]>(ZONES);

  /** Mock: flow of the previous day (real source: ES, previous day). */
  readonly flowYesterday = signal<FlowStats>({ entry: 1550, exit: 1542 });
  /** Mock: % change vs the previous day per KPI (real source: ES, previous day). */
  readonly kpiChange = signal({ total: 12, crosswalk: 6, wrongway: 14, parking: 18, taxi: -5, congestion: 9, vehicles: 8 });

  //Start of the first of the 24 hourly buckets.
  private readonly windowStart = computed(() => Math.floor(this.now() / HOUR) * HOUR - 23 * HOUR);
  private readonly inWindow = computed(() => this.allEvents().filter((e) => e.event_time >= this.windowStart())); // Events in last 24 h

  readonly kpis = computed(() => {
    const count = (...names: EventName[]) => this.inWindow().filter((e) => names.includes(e.event_name)).length;
    return {
      total: this.inWindow().length,
      crosswalk: count('Crosswalk Violation'),
      wrongway: count('Wrong Way'),
      parking: count('Parking Overstay'),
      taxi: count('Illegal Taxi'),
      congestion: count('Road Congestion', 'Flyover Congestion'),
    };
  });

  /** Vehicles counted in the last 24 h (mock until the API provides it). */
  readonly vehicles = signal({ car: 48210, truck: 6240, bus: 2150 });
  readonly vehicleTotal = computed(() => {
    const v = this.vehicles();
    return v.car + v.truck + v.bus;
  });

  readonly hourly = computed<HourBucket[]>(() => {
    const start = this.windowStart();
    const counts = new Array<number>(24).fill(0);
    for (const e of this.inWindow()){
      counts[Math.floor((e.event_time - start) / HOUR)]++; // calculate the time of event
    }
    return counts.map((count, i) => ({
      label: formatHour12(start + i * HOUR), count
    }));
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

  /** Events that arrived in the last few seconds → blink in the feed, flash on the map. */
  private readonly freshEvents = computed(() => this.events().filter((e) => this.now() - e.event_time < FRESH_MS));
  readonly freshEventIds = computed(() => new Set(this.freshEvents().map((e) => e.id)), { equal: sameSet });
  readonly freshCameraIds = computed(() => new Set(this.freshEvents().map((e) => e.camera_id)), { equal: sameSet });

  constructor() {
    const now = Date.now();
    this.allEvents.set(
      this.cameras
        .flatMap((cam) => Array.from({ length: cam.events24h }, () => this.makeEvent(cam, this.windowStart() + Math.random() * (now - this.windowStart()))))
        .sort((a, b) => a.event_time - b.event_time),
    );

    setInterval(() => this.now.set(Date.now()), 1000);
    this.scheduleLiveEvent();
    setInterval(() => this.drift(), 10_000);
  }

  private makeEvent(cam: Camera, time: number): TrafficEvent {
    const event_name = EVENT_NAMES[Math.floor(Math.random() * EVENT_NAMES.length)];
    return { id: this.nextId++, event_name, camera_id: cam.ip, camera_name: cam.name, event_time: time };
  }

  // A new event every 3–10 s, on a random camera (silent cameras never fire).
  private scheduleLiveEvent(): void {
    setTimeout(() => {
      const activeCameras = this.cameras.filter((c) => c.events24h > 0);
      const cam = activeCameras[Math.floor(Math.random() * activeCameras.length)];
      const from = this.windowStart();
      this.allEvents.update((list) => [...list.filter((e) => e.event_time >= from), this.makeEvent(cam, Date.now())]);
      this.scheduleLiveEvent();
    }, 3000 + Math.random() * 7000);
  }

  // Small random movement in the flow and zone numbers. 
  private drift(): void {
    this.lastUpdate.set(Date.now());
    const wobble = (v: number) => Math.round(v * (1 + (Math.random() - 0.5) * 0.06));
    this.flow.update((f) => ({ entry: wobble(f.entry), exit: wobble(f.exit) }));
    this.vehicles.update((v) => ({
      car: v.car + Math.round(Math.random() * 40),
      truck: v.truck + Math.round(Math.random() * 6),
      bus: v.bus + Math.round(Math.random() * 3),
    }));
    this.zones.update((zones) => zones.map((z) => ({ ...z, value: z.value + Math.round(Math.random() * 120) })).sort((a, b) => b.value - a.value));
  }
}
