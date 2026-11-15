import { Injectable, computed, signal } from '@angular/core';
import { HARAM_CENTER } from './cameras.service';
import { ALERT_KEYS, AlertKey, Lamp, LampMode, LampStatus, LocationStat, MODE_KEYS } from '../models/municipality.model';

const LAMP_COUNT = 50;
const BASELINE_KWH = 26_500; // agreed baseline for the same period (mock)

const STATUS_WEIGHTS: Array<[LampStatus, number]> = [
  ['on', 0.68],
  ['on-alert', 0.1],
  ['off', 0.1],
  ['off-alert', 0.06],
  ['nodata', 0.06],
];
const MODE_WEIGHTS: Array<[LampMode, number]> = [
  ['astro', 0.6],
  ['lux', 0.28],
  ['manual', 0.1],
  ['factory', 0.02],
];

function pick<T>(weights: Array<[T, number]>): T {
  let r = Math.random();
  for (const [value, w] of weights) if ((r -= w) < 0) return value;
  return weights[0][0];
}

const randomAlert = (): AlertKey => ALERT_KEYS[Math.floor(Math.random() * ALERT_KEYS.length)];
const hasAlert = (s: LampStatus) => s === 'on-alert' || s === 'off-alert';

/** Mock VISuite indicators (real source: Elasticsearch events grouped by location). */
const ABANDONED: LocationStat[] = [
  { ar: 'ساحة المنطقة أ', value: 24 },
  { ar: 'عداد 103', value: 19 },
  { ar: 'دخول الحرم', value: 15 },
  { ar: 'عداد 106', value: 11 },
  { ar: 'ساحة المنطقة ب', value: 7 },
];
const CONGESTION: LocationStat[] = [
  { ar: 'خروج الحرم', value: 58 },
  { ar: 'دخول الحرم', value: 47 },
  { ar: 'عداد 103', value: 36 },
  { ar: 'تقاطع الدائري الأول', value: 29 },
  { ar: 'عداد 106', value: 18 },
];
const TRIPFALL: LocationStat[] = [
  { ar: 'ممر المنطقة ب', value: 14 },
  { ar: 'رصيف عداد 106', value: 11 },
  { ar: 'درج دخول الحرم', value: 9 },
  { ar: 'ساحة المنطقة أ', value: 6 },
  { ar: 'ممر عداد 103', value: 4 },
];

@Injectable({ providedIn: 'root' })
export class MunicipalityStore {
  readonly lamps = signal<Lamp[]>(this.makeLamps());
  readonly energyKwh = signal(18_420);
  /** Mock: % change vs the previous day per KPI (real source: ES, previous day). */
  readonly kpiChange = signal({ faults: -8, energy: 4, savings: 3 });
  readonly lastUpdate = signal(Date.now());

  readonly abandoned = signal<LocationStat[]>(ABANDONED);
  readonly congestion = signal<LocationStat[]>(CONGESTION);
  readonly tripfall = signal<LocationStat[]>(TRIPFALL);

  readonly statusCounts = computed(() => {
    const c = { on: 0, off: 0, nodata: 0, faults: 0, total: 0 };
    for (const l of this.lamps()) {
      c.total++;
      if (l.status === 'on' || l.status === 'on-alert') c.on++;
      else if (l.status === 'off' || l.status === 'off-alert') c.off++;
      else c.nodata++;
      if (hasAlert(l.status)) c.faults++;
    }
    return c;
  });

  readonly alertCounts = computed(() => {
    const c = Object.fromEntries(ALERT_KEYS.map((k) => [k, 0])) as Record<AlertKey, number>;
    for (const l of this.lamps()) if (l.alert) c[l.alert]++;
    return c;
  });

  readonly modeCounts = computed(() => {
    const c = Object.fromEntries(MODE_KEYS.map((k) => [k, 0])) as Record<LampMode, number>;
    for (const l of this.lamps()) c[l.mode]++;
    return c;
  });

  /** Savings vs the agreed baseline, in percent. */
  readonly savingsPct = computed(() => Math.max(0, Math.round((1 - this.energyKwh() / BASELINE_KWH) * 100)));

  constructor() {
    setInterval(() => this.drift(), 10_000);
  }

  private makeLamps(): Lamp[] {
    const [lat, lon] = HARAM_CENTER;
    return Array.from({ length: LAMP_COUNT }, (_, i) => {
      const status = pick(STATUS_WEIGHTS);
      return {
        id: `L-${String(i + 1).padStart(4, '0')}`,
        name: `عمود إنارة ${i + 1}`,
        lat: lat + (Math.random() - 0.5) * 0.024,
        lon: lon + (Math.random() - 0.5) * 0.03,
        status,
        mode: pick(MODE_WEIGHTS),
        alert: hasAlert(status) ? randomAlert() : undefined,
      };
    });
  }

  // A few lamps change state, energy and indicators creep up.
  private drift(): void {
    this.lastUpdate.set(Date.now());
    const changed = new Set(Array.from({ length: 3 }, () => Math.floor(Math.random() * LAMP_COUNT)));
    this.lamps.update((list) =>
      list.map((l, i) => {
        if (!changed.has(i)) return l;
        const status = pick(STATUS_WEIGHTS);
        return { ...l, status, alert: hasAlert(status) ? randomAlert() : undefined };
      }),
    );
    this.energyKwh.update((v) => v + 5 + Math.round(Math.random() * 20));
    const bump = (rows: LocationStat[]) =>
      rows.map((r) => (Math.random() < 0.3 ? { ...r, value: r.value + 1 } : r)).sort((a, b) => b.value - a.value);
    this.abandoned.update(bump);
    this.congestion.update(bump);
    this.tripfall.update(bump);
  }
}
