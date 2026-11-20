import { Injectable, computed, inject, signal } from '@angular/core';
import { Camera, CamerasService } from './cameras.service';
import { EventName, TrafficEvent } from '../models/traffic-event.model';

const FRESH_MS = 7_000; // how long a new event / map marker stays highlighted
const FEED_SIZE = 15; // keep the last 15 events

const EVENT_NAMES: EventName[] = [
  'Crosswalk Violation',
  'Wrong Way',
  'Parking Overstay',
  'Illegal Taxi',
  'Road Congestion',
  'Flyover Congestion',
];

interface Prayer {
  ar: string;
  /** minutes from midnight */
  at: number;
}

/** Prayer times for Madinah (mock; real source: AlAdhan API, Umm al-Qura). */
const PRAYERS: Prayer[] = [
  { ar: 'الفجر', at: 5 * 60 + 12 },
  { ar: 'الظهر', at: 12 * 60 + 18 },
  { ar: 'العصر', at: 15 * 60 + 38 },
  { ar: 'المغرب', at: 18 * 60 + 25 },
  { ar: 'العشاء', at: 19 * 60 + 55 },
];

const sameSet = (a: Set<unknown>, b: Set<unknown>) => a.size === b.size && [...a].every((x) => b.has(x));

/** Live (mock) state shared by the traffic dashboard: clock, speed, context factors and the camera event feed. */
@Injectable({ providedIn: 'root' })
export class TrafficStore {
  private readonly cameras = inject(CamerasService).cameras();
  private nextId = 1;

  /** Ticks every second. */
  readonly now = signal(Date.now());
  readonly lastUpdate = signal(Date.now());
  private readonly allEvents = signal<TrafficEvent[]>([]);

  /** Mock: average speed km/h (real source: HERE Traffic Flow). */
  readonly speed = signal(58);
  /** Mock: context factors (real sources: NCM weather, FlightStats, Nusuk). */
  readonly weather = signal({ temp: 29, text: 'غائم جزئياً', wind: 18 });
  readonly flights = signal({ next3h: 37, delayed: 5 });
  readonly visitors = signal({ today: 1245000, change: 6 });

  /** Next prayer + live countdown (HH:MM:SS). */
  readonly nextPrayer = computed(() => {
    const d = new Date(this.now());
    const sec = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
    const next = PRAYERS.find((p) => p.at * 60 > sec) ?? { ...PRAYERS[0], at: PRAYERS[0].at + 24 * 60 };
    const left = next.at * 60 - sec;
    const pad = (n: number) => String(n).padStart(2, '0');
    const h = Math.floor(next.at / 60) % 24;
    return {
      ar: next.ar,
      time: `${h % 12 || 12}:${pad(next.at % 60)} ${h < 12 ? 'ص' : 'م'}`,
      countdown: `${pad(Math.floor(left / 3600))}:${pad(Math.floor((left % 3600) / 60))}:${pad(left % 60)}`,
    };
  });

  /** Events that arrived in the last few seconds → the camera markers / tiles flash. */
  private readonly freshEvents = computed(() => this.allEvents().filter((e) => this.now() - e.event_time < FRESH_MS));
  readonly freshCameraIds = computed(() => new Set(this.freshEvents().map((e) => e.camera_id)), { equal: sameSet });

  constructor() {
    setInterval(() => this.now.set(Date.now()), 1000);
    this.scheduleLiveEvent();
    setInterval(() => this.drift(), 10_000);
  }

  private makeEvent(cam: Camera): TrafficEvent {
    const event_name = EVENT_NAMES[Math.floor(Math.random() * EVENT_NAMES.length)];
    return { id: this.nextId++, event_name, camera_id: cam.ip, camera_name: cam.name, event_time: Date.now() };
  }

  // A new event every 3–10 s, on a random camera (silent cameras never fire).
  private scheduleLiveEvent(): void {
    setTimeout(() => {
      const active = this.cameras.filter((c) => c.events24h > 0);
      const cam = active[Math.floor(Math.random() * active.length)];
      this.allEvents.update((list) => [...list, this.makeEvent(cam)].slice(-FEED_SIZE));
      this.scheduleLiveEvent();
    }, 3000 + Math.random() * 7000);
  }

  // Small random movement in the speed.
  private drift(): void {
    this.lastUpdate.set(Date.now());
    this.speed.update((v) => Math.min(75, Math.max(40, v + Math.round((Math.random() - 0.5) * 4))));
  }
}
