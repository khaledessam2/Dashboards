import { FlashOnChange } from '../../../shared/directives/flash-on-change';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { PERIOD_OPTIONS, PoliceStore, SEVERITY_OPTIONS, TYPE_OPTIONS, ZONE_OPTIONS } from '../../../shared/services/police-store';
import { PoliceBreakdown } from '../components/breakdown/breakdown';
import { PoliceCamMap } from '../components/cam-map/cam-map';
import { PoliceCamRanking } from '../components/cam-ranking/cam-ranking';
import { PoliceCamTrend } from '../components/cam-trend/cam-trend';
import { PoliceCompareGauge } from '../components/compare-gauge/compare-gauge';
import { PoliceHourlyChart } from '../components/hourly-chart/hourly-chart';
import { PoliceInfraMetrics } from '../components/infra-metrics/infra-metrics';
import { PoliceLiveEvents } from '../components/live-events/live-events';
import { PoliceTopZones } from '../components/top-zones/top-zones';

type Tone = 'ok' | 'bad' | 'warn';

interface Tile {
  id: string;
  label: string;
  icon: string;
  value: string;
  sub?: string;
  /** Colour of the value and icon badge. */
  color: string;
  /** Accent (icon + top bar). */
  accent: string;
  bg: string;
  pct: number;
  /** Tone of the % chip when the metric goes up (down is always green). */
  upTone: Tone;
}

const CHIP: Record<Tone, string> = { ok: 'bg-[#ecfdf5] text-[#059669]', bad: 'bg-[#fff1f2] text-[#e11d48]', warn: 'bg-[#fffbeb] text-[#d97706]' };
const fmt = (n: number) => n.toLocaleString('en-US');

@Component({
  selector: 'app-police-dashboard',
  imports: [FlashOnChange, PoliceLiveEvents, PoliceCamMap, PoliceBreakdown, PoliceHourlyChart, PoliceCamRanking, PoliceCamTrend, PoliceCompareGauge, PoliceTopZones, PoliceInfraMetrics],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-h-full bg-[#f6f8fb] [font-family:IBM_Plex_Sans_Arabic,Cairo,sans-serif]' },
  templateUrl: './police-dashboard.html',
})
export class PoliceDashboard {
  protected readonly store = inject(PoliceStore);

  protected readonly dateText = computed(() => {
    const d = new Date(this.store.now());
    const date = new Intl.DateTimeFormat('ar-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
    const time = d.toLocaleTimeString('ar-u-nu-latn', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${date} | ${time}`;
  });

  protected readonly updatedText = computed(() => {
    const mins = Math.floor((this.store.now() - this.store.lastUpdate()) / 60000);
    return mins < 1 ? 'قبل دقيقة' : `قبل ${mins} دقيقة`;
  });

  protected fullscreen(): void {
    void document.documentElement.requestFullscreen?.();
  }

  protected readonly periods = PERIOD_OPTIONS;
  protected readonly today = new Date().toISOString().slice(0, 10);
  protected readonly zones = ZONE_OPTIONS;
  protected readonly types = TYPE_OPTIONS;
  protected readonly severities = SEVERITY_OPTIONS;

  /** Top KPI row (#1–#5, #13, #26). */
  protected readonly tiles = computed<Tile[]>(() => {
    const k = this.store.kpis();
    const c = this.store.kpiChange();
    const e = this.store.extraChange();
    const obj = this.store.objects();
    const link = this.store.cameraLink();
    return [
      { id: 'total', label: 'إجمالي الأحداث الأمنية', icon: 'shield', value: fmt(this.store.totalAll()), color: '#1c2434', accent: '#0b5cff', bg: '#eaf1ff', pct: e.total, upTone: 'ok' },
      { id: 'restricted', label: 'اختراق مناطق محظورة', icon: 'block', value: fmt(k.restricted), color: '#e11d48', accent: '#e11d48', bg: '#fff1f2', pct: c.restricted, upTone: 'bad' },
      { id: 'leftobj', label: 'الأجسام المتروكة', icon: 'inventory_2', value: fmt(k.leftobj), color: '#1c2434', accent: '#f59e0b', bg: '#fffbeb', pct: c.leftobj, upTone: 'bad' },
      { id: 'crowd50', label: 'الازدحام الحرج (+50)', icon: 'groups', value: fmt(k.overcrowd50), color: '#e11d48', accent: '#e11d48', bg: '#fff1f2', pct: c.overcrowd50, upTone: 'bad' },
      { id: 'crowd30', label: 'الازدحام التحذيري (+30)', icon: 'warning', value: fmt(k.overcrowd30), color: '#d97706', accent: '#f59e0b', bg: '#fffbeb', pct: c.overcrowd30, upTone: 'warn' },
      { id: 'persons', label: 'الأشخاص المرصودون', icon: 'person', value: fmt(obj.persons + obj.vehicles + obj.other), color: '#1c2434', accent: '#0b5cff', bg: '#eaf1ff', pct: e.persons, upTone: 'ok' },
      { id: 'cameras', label: 'اتصال الكاميرات', icon: 'videocam', value: `${Math.round((link.online / link.total) * 100)}%`, sub: `${link.online} من ${link.total} كاميرا متصلة`, color: '#059669', accent: '#10b981', bg: '#ecfdf5', pct: e.cameras, upTone: 'ok' },
    ];
  });

  protected readonly hero = computed(() => this.tiles()[0]);
  protected readonly others = computed(() => this.tiles().slice(1));

  /** Sparkline of the selected window (events per bucket) for the hero card. */
  protected readonly spark = computed(() => {
    const pts = this.store.timeline().map((b) => b.count);
    const max = Math.max(...pts, 1);
    const step = 200 / Math.max(pts.length - 1, 1);
    const xy = pts.map((v, i) => [+(i * step).toFixed(1), +(46 - (v / max) * 40).toFixed(1)]);
    const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
    return { line, area: `${line} L200 50 L0 50 Z` };
  });

  /** Secondary strip (#6–#10 + composite scenarios + mean duration). */
  protected readonly strip = computed(() => {
    const k = this.store.kpis();
    const x = this.store.extraScaled();
    const c = this.store.kpiChange();
    const e = this.store.extraChange();
    const s = this.store.scenario();
    return [
      { label: 'أحداث سيناريوهات مركبة', icon: 'hub', bg: '#f5f3ff', color: '#7c3aed', value: fmt(s.composite), pct: e.composite, up: 'bad' as Tone },
      { label: 'متوسط مدة الأحداث', icon: 'timer', bg: '#eaf1ff', color: '#0b5cff', value: `${s.avgMinutes} دقيقة`, pct: e.avgMinutes, up: 'bad' as Tone },
      { label: 'السقوط والتعثر', icon: 'personal_injury', bg: '#fff1f2', color: '#e11d48', value: fmt(k.tripfall), pct: c.tripfall, up: 'bad' as Tone },
      { label: 'الاقتحام خارج الدوام', icon: 'door_open', bg: '#fff1f2', color: '#e11d48', value: fmt(x.intrusion), pct: c.intrusion, up: 'bad' as Tone },
      { label: 'التكدس قرب المداخل', icon: 'groups', bg: '#fffbeb', color: '#d97706', value: fmt(x.loitering), pct: c.loitering, up: 'bad' as Tone },
      { label: 'طوابير تجاوز الحد', icon: 'queue', bg: '#ecfeff', color: '#0891b2', value: fmt(x.queue), pct: c.queue, up: 'bad' as Tone },
      { label: 'الازدحام الثابت', icon: 'transfer_within_a_station', bg: '#fffbeb', color: '#d97706', value: fmt(x.stationary), pct: c.stationary, up: 'bad' as Tone },
    ];
  });

  protected readonly objectItems = computed(() => {
    const o = this.store.objects();
    const total = o.persons + o.vehicles + o.other;
    const pct = (v: number) => Math.round((v / total) * 100);
    return [
      { name: 'أشخاص', y: o.persons, color: '#0b5cff', pct: pct(o.persons) },
      { name: 'مركبات', y: o.vehicles, color: '#f59e0b', pct: pct(o.vehicles) },
      { name: 'أخرى', y: o.other, color: '#94a3b8', pct: pct(o.other) },
    ];
  });

  protected chipClass(pct: number, up: Tone): string {
    return pct > 0 ? CHIP[up] : CHIP.ok;
  }

  protected arrow(pct: number): string {
    return `${Math.abs(pct)}% ${pct > 0 ? '↑' : '↓'}`;
  }

  protected textTone(pct: number, up: Tone): string {
    return pct > 0 ? (up === 'bad' ? 'text-[#e11d48]' : up === 'warn' ? 'text-[#d97706]' : 'text-[#059669]') : 'text-[#059669]';
  }
}
