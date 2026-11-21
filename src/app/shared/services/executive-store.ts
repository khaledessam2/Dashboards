import { Injectable, computed, signal } from '@angular/core';

export type SectorId = 'traffic' | 'security' | 'municipal' | 'command';
export type Sev = 'crit' | 'high' | 'mid' | 'low';

export const SECTORS: Record<SectorId, { ar: string; color: string; icon: string }> = {
  traffic: { ar: 'المرور', color: '#0284c7', icon: 'swap_horiz' },
  security: { ar: 'الأمن العام', color: '#dc2626', icon: 'shield' },
  municipal: { ar: 'البلدية', color: '#059669', icon: 'eco' },
  command: { ar: 'القيادة', color: '#7c3aed', icon: 'videocam' },
};
export const SECTOR_IDS: SectorId[] = ['traffic', 'security', 'municipal', 'command'];

export interface CriticalIncident {
  id: number;
  time: string;
  sector: SectorId;
  title: string;
  place: string;
  action: string;
  fresh: boolean;
}

export interface Region { id: string; ar: string; scale: number }
export interface Period { id: string; ar: string; scale: number }
export const REGIONS: Region[] = [
  { id: 'all', ar: 'جميع المناطق والقطاعات', scale: 1 },
  { id: 'north', ar: 'المنطقة الشمالية', scale: 0.32 },
  { id: 'central', ar: 'المنطقة المركزية', scale: 0.41 },
  { id: 'south', ar: 'المنطقة الجنوبية', scale: 0.27 },
];
export const PERIODS: Period[] = [
  { id: '24h', ar: 'آخر 24 ساعة', scale: 1 },
  { id: '7d', ar: 'آخر 7 أيام', scale: 6.4 },
  { id: '30d', ar: 'آخر 30 يوماً', scale: 24 },
];

const INCIDENT_POOL: Omit<CriticalIncident, 'id' | 'time' | 'fresh'>[] = [
  { sector: 'traffic', title: 'حادث مروري جسيم', place: 'طريق الملك فهد', action: 'استجابة' },
  { sector: 'security', title: 'دخول منطقة محظورة', place: 'حي الشاطئ', action: 'توجيه' },
  { sector: 'municipal', title: 'انقطاع إنارة رئيسية', place: 'حي العزيزية', action: 'إصلاح' },
  { sector: 'command', title: 'ارتفاع استهلاك الخادم', place: 'مركز البيانات', action: 'فحص' },
  { sector: 'traffic', title: 'ازدحام شديد عند التقاطع', place: 'دوار المطار', action: 'توجيه' },
  { sector: 'security', title: 'بلاغ تجمهر غير مرخص', place: 'الميدان المركزي', action: 'استجابة' },
  { sector: 'municipal', title: 'تسرب مياه رئيسي', place: 'حي الروضة', action: 'إصلاح' },
  { sector: 'command', title: 'فقدان اتصال كاميرات', place: 'المحور الشرقي', action: 'فحص' },
];

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));
const jit = (v: number, d: number, min: number, max: number, digits = 0): number => {
  const n = clamp(v + (Math.random() * 2 - 1) * d, min, max);
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};
const pad = (n: number): string => String(n).padStart(2, '0');
const clock = (d: Date): string => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

interface State {
  total: number;
  critical: number;
  safety: number;
  flow: number;
  resolved: number;
  response: number;
  readiness: number;
  infra: number;
  sectors: Record<SectorId, number>;
  trend: number[];
  traffic: { speed: number; minor: number; bars: number[] };
  security: { sensitivity: number; abandoned: number; today: number };
  municipal: { fleet: number; reports: number; delayed: number };
  command: { usage: number; alerts: number; uptime: number };
  delayed: Record<SectorId, number>;
  risks: { id: number; name: string; count: number }[];
  sla: Record<SectorId, number>;
  heat: number;
}

/** Simulated live feed for the unified executive command dashboard. */
@Injectable({ providedIn: 'root' })
export class ExecutiveStore {
  private readonly state = signal<State>({
    total: 1248,
    critical: 42,
    safety: 96.5,
    flow: 76,
    resolved: 91.7,
    response: 12.4,
    readiness: 94.6,
    infra: 98.8,
    sectors: { traffic: 412, security: 312, municipal: 274, command: 250 },
    trend: [212, 228, 262, 236, 250],
    traffic: { speed: 58, minor: 29, bars: [100, 92, 70, 52, 42, 30] },
    security: { sensitivity: 94, abandoned: 118, today: 316 },
    municipal: { fleet: 96, reports: 274, delayed: 311 },
    command: { usage: 40, alerts: 8, uptime: 99.93 },
    delayed: { traffic: 5, security: 4, municipal: 6, command: 2 },
    risks: [
      { id: 1, name: 'حي العيوية', count: 149 },
      { id: 2, name: 'حي العيون', count: 120 },
      { id: 3, name: 'حي الشامل', count: 105 },
      { id: 4, name: 'حي بئر عثمان', count: 94 },
      { id: 5, name: 'حي الجروم', count: 76 },
    ],
    sla: { traffic: 95, security: 94, municipal: 91, command: 98 },
    heat: 0.8,
  });

  private seq = 4;
  readonly incidents = signal<CriticalIncident[]>(this.seedIncidents());
  readonly lastUpdate = signal(Date.now());

  readonly region = signal<Region>(REGIONS[0]);
  readonly period = signal<Period>(PERIODS[0]);

  readonly s = this.state.asReadonly();
  readonly scale = computed(() => this.region().scale * this.period().scale);

  readonly total = computed(() => Math.round(this.s().total * this.scale()));
  readonly critical = computed(() => Math.max(1, Math.round(this.s().critical * this.region().scale)));
  readonly sectorCounts = computed(() => {
    const k = this.scale();
    const c = this.s().sectors;
    return SECTOR_IDS.map((id) => ({ id, count: Math.round(c[id] * k) }));
  });
  readonly delayedTotal = computed(() => SECTOR_IDS.reduce((a, id) => a + this.s().delayed[id], 0));
  readonly slaAvg = computed(() => {
    const v = SECTOR_IDS.map((id) => this.s().sla[id]);
    return Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10;
  });

  constructor() {
    setInterval(() => this.tick(), 3000);
    setInterval(() => this.pushIncident(), 11000);
  }

  private seedIncidents(): CriticalIncident[] {
    const now = new Date();
    return [0, 1, 2, 3].map((i) => ({
      id: i,
      time: clock(new Date(now.getTime() - (i * 13 + 3) * 60000)),
      fresh: false,
      ...INCIDENT_POOL[i],
    }));
  }

  private pushIncident(): void {
    const pick = INCIDENT_POOL[Math.floor(Math.random() * INCIDENT_POOL.length)];
    const next: CriticalIncident = { id: ++this.seq, time: clock(new Date()), fresh: true, ...pick };
    this.incidents.update((l) => [next, ...l.map((x) => ({ ...x, fresh: false }))].slice(0, 4));
  }

  private tick(): void {
    this.state.update((p) => {
      const sectors = { ...p.sectors };
      const sector = SECTOR_IDS[Math.floor(Math.random() * 4)];
      sectors[sector] += Math.random() < 0.7 ? 1 : 0;
      const trend = [...p.trend];
      trend[trend.length - 1] = jit(trend[trend.length - 1], 4, 180, 320);
      const sla = { ...p.sla };
      for (const id of SECTOR_IDS) sla[id] = jit(sla[id], 0.6, 85, 99);
      const delayed = { ...p.delayed };
      const dk = SECTOR_IDS[Math.floor(Math.random() * 4)];
      delayed[dk] = clamp(delayed[dk] + (Math.random() < 0.5 ? 1 : -1), 0, 12);
      const risks = p.risks.map((r) => ({ ...r, count: jit(r.count, 3, 20, 220) })).sort((a, b) => b.count - a.count);
      return {
        ...p,
        total: SECTOR_IDS.reduce((a, id) => a + sectors[id], 0),
        critical: Math.round(jit(p.critical, 1.2, 28, 58)),
        safety: jit(p.safety, 0.2, 93, 99, 1),
        flow: Math.round(jit(p.flow, 1.5, 55, 92)),
        resolved: jit(p.resolved, 0.3, 85, 98, 1),
        response: jit(p.response, 0.3, 8, 18, 1),
        readiness: jit(p.readiness, 0.2, 90, 99, 1),
        infra: jit(p.infra, 0.1, 95, 99.9, 1),
        sectors,
        trend,
        traffic: { speed: Math.round(jit(p.traffic.speed, 2, 35, 80)), minor: Math.round(jit(p.traffic.minor, 2, 10, 50)), bars: p.traffic.bars },
        security: { sensitivity: Math.round(jit(p.security.sensitivity, 1, 85, 99)), abandoned: Math.round(jit(p.security.abandoned, 3, 60, 160)), today: p.security.today + (Math.random() < 0.4 ? 1 : 0) },
        municipal: { fleet: Math.round(jit(p.municipal.fleet, 1, 85, 100)), reports: Math.round(jit(p.municipal.reports, 3, 180, 360)), delayed: Math.round(jit(p.municipal.delayed, 4, 200, 400)) },
        command: { usage: Math.round(jit(p.command.usage, 3, 20, 80)), alerts: Math.round(jit(p.command.alerts, 1, 2, 16)), uptime: jit(p.command.uptime, 0.01, 99.8, 99.99, 2) },
        delayed,
        risks,
        sla,
        heat: jit(p.heat, 0.05, 0.6, 1, 2),
      };
    });
    this.lastUpdate.set(Date.now());
  }
}
