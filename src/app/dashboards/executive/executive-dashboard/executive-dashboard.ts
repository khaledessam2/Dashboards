import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import type Highcharts from 'highcharts';
import { FlashOnChange } from '../../../shared/directives/flash-on-change';
import { HcChart } from '../../../shared/components/ops-widgets/hc-chart/hc-chart';
import { ExecutiveStore, PERIODS, REGIONS, SECTORS, SECTOR_IDS, SectorId, Sev } from '../../../shared/services/executive-store';

interface Kpi {
  id: string;
  ar: string;
  icon: string;
  color: string;
  value: string;
  change: string;
  up: boolean;
  good: boolean;
  note?: string;
  unit?: string;
  crit?: boolean;
}

interface MapPoint { sector: SectorId; x: number; y: number; icon: string; label?: string }

const MAP_POINTS: MapPoint[] = [
  { sector: 'traffic', x: 330, y: 235, icon: 'swap_horiz', label: 'طريق المطار' },
  { sector: 'security', x: 560, y: 285, icon: 'shield' },
  { sector: 'command', x: 575, y: 440, icon: 'videocam' },
  { sector: 'municipal', x: 295, y: 495, icon: 'eco' },
];

const SEV_COLOR: Record<Sev, string> = { crit: '#dc2626', high: '#ea580c', mid: '#d97706', low: '#059669' };

@Component({
  selector: 'app-executive-dashboard',
  imports: [FlashOnChange, HcChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'dc-theme block min-h-full' },
  templateUrl: './executive-dashboard.html',
}) 
export class ExecutiveDashboard {
  protected readonly store = inject(ExecutiveStore);
  protected readonly regions = REGIONS;
  protected readonly periods = PERIODS;
  protected readonly sectorIds = SECTOR_IDS;
  protected readonly sectors = SECTORS;
  protected readonly sevColor = SEV_COLOR;

  private readonly now = signal(Date.now());
  protected readonly zoom = signal(1);
  protected readonly hidden = signal<SectorId[]>([]);

  constructor() {
    const id = setInterval(() => this.now.set(Date.now()), 15_000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }

  protected readonly clockText = computed(() => {
    const d = new Date(this.now());
    const date = new Intl.DateTimeFormat('ar-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
    const time = d.toLocaleTimeString('ar-u-nu-latn', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${date} • ${time}`;
  });

  protected readonly year = new Date().getFullYear();

  protected readonly fmt = (n: number): string => n.toLocaleString('en-US');

  protected fullscreen(): void {
    void document.documentElement.requestFullscreen?.();
  }

  protected setRegion(id: string): void {
    this.store.region.set(REGIONS.find((r) => r.id === id) ?? REGIONS[0]);
  }
  protected setPeriod(id: string): void {
    this.store.period.set(PERIODS.find((p) => p.id === id) ?? PERIODS[0]);
  }

  // ── KPIs ───────────────────────────────────────────────
  protected readonly kpis = computed<Kpi[]>(() => {
    const s = this.store.s();
    return [
      { id: 'k-total', ar: 'إجمالي الأحداث النشطة', icon: 'inventory_2', color: '#2563eb', value: this.fmt(this.store.total()), change: '7%+', up: true, good: true, note: 'مقارنة بأمس' },
      { id: 'k-crit', ar: 'الأحداث الحرجة', icon: 'warning', color: '#dc2626', value: String(this.store.critical()), change: '12%+', up: true, good: false, note: 'تتطلب إجراء فورياً', crit: true },
      { id: 'k-safe', ar: 'مستوى السلامة والأمان', icon: 'verified_user', color: '#4f46e5', value: `${s.safety}%`, change: '1.1%+', up: true, good: true, note: 'مستقر وآمن' },
      { id: 'k-flow', ar: 'انسيابية الحركة', icon: 'swap_horiz', color: '#0284c7', value: `${s.flow}%`, change: '6%+', up: true, good: true, note: 'تدفق جيد جداً' },
      { id: 'k-res', ar: 'نسبة معالجة الأحداث', icon: 'task_alt', color: '#059669', value: `${s.resolved}%`, change: '3.2%-', up: false, good: false, note: 'ضمن النطاق المقبول' },
      { id: 'k-resp', ar: 'متوسط زمن الاستجابة', icon: 'schedule', color: '#d97706', value: `${s.response}`, change: '1.8 د', up: false, good: true, note: 'أسرع عن الهدف', unit: 'دقيقة' },
      { id: 'k-ready', ar: 'جاهزية الخدمات البلدية', icon: 'shield_moon', color: '#0d9488', value: `${s.readiness}%`, change: '1.8%+', up: true, good: true, note: 'كفاءة عالية' },
      { id: 'k-infra', ar: 'البنية التحتية والأنظمة', icon: 'dns', color: '#9333ea', value: `${s.infra}%`, change: '0.6%+', up: true, good: true, note: 'توافر مثالي' },
    ];
  });

  // ── Sector cards ───────────────────────────────────────
  protected readonly sectorCards = computed(() => {
    const s = this.store.s();
    const t = s.traffic;
    return [
      {
        id: 'traffic', title: 'قطاع المرور والنقل', badge: 'انسيابي', color: SECTORS.traffic.color, bar: s.flow,
        metrics: [
          { l: 'الانسيابية', v: `${s.flow}%`, c: SECTORS.traffic.color },
          { l: 'متوسط السرعة', v: `${t.speed} كم/س`, c: '' },
          { l: 'حوادث بسيطة', v: String(t.minor), c: '' },
        ],
        bars: t.bars,
      },
      {
        id: 'security', title: 'الأمن العام والعمليات', badge: 'مؤشرات دقيقة', color: SECTORS.security.color, bar: s.security.sensitivity,
        metrics: [
          { l: 'مؤشرات حساسة', v: `${s.security.sensitivity}%`, c: '' },
          { l: 'أجسام متروكة', v: String(s.security.abandoned), c: '#d97706' },
          { l: 'حدث أمني اليوم', v: String(s.security.today), c: SECTORS.security.color },
        ],
      },
      {
        id: 'municipal', title: 'الخدمات البلدية والبيئية', badge: `جاهزية ${s.municipal.fleet}%`, color: SECTORS.municipal.color, bar: s.municipal.fleet,
        metrics: [
          { l: 'الإدارة والنظافة', v: `${s.municipal.fleet}%`, c: '' },
          { l: 'تأخر خدمات', v: String(s.municipal.delayed), c: '' },
          { l: 'بلاغات نشطة', v: String(s.municipal.reports), c: SECTORS.municipal.color },
        ],
      },
      {
        id: 'command', title: 'القيادة والبنية السحابية', badge: `توافر ${s.command.uptime}%`, color: SECTORS.command.color, bar: s.command.usage,
        metrics: [
          { l: 'استخدام المعالج', v: `${s.command.usage}%`, c: '' },
          { l: 'تنبيهات حرجة', v: String(s.command.alerts), c: '' },
          { l: 'توافر الخدمات', v: `${s.command.uptime}%`, c: SECTORS.command.color },
        ],
      },
    ];
  });

  // ── Charts ─────────────────────────────────────────────
  protected readonly donut = computed<Highcharts.Options>(() => ({
    chart: { type: 'pie', spacing: [0, 0, 0, 0] },
    tooltip: { shared: false, pointFormat: '<b>{point.y}</b> حدث ({point.percentage:.0f}%)' },
    plotOptions: { pie: { innerSize: '72%', borderWidth: 4, borderColor: '#fff', dataLabels: { enabled: false }, states: { hover: { halo: { size: 4 } } } } },
    series: [{
      type: 'pie',
      name: 'الأحداث',
      data: this.store.sectorCounts().map((c) => ({ name: SECTORS[c.id].ar, y: c.count, color: SECTORS[c.id].color })),
    }],
  }));

  protected readonly shares = computed(() => {
    const list = this.store.sectorCounts();
    const sum = list.reduce((a, c) => a + c.count, 0) || 1;
    return list.map((c) => ({ ...c, pct: Math.round((c.count / sum) * 100) }));
  });

  protected readonly trend = computed<Highcharts.Options>(() => {
    const days = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(this.now() - (4 - i) * 86_400_000);
      return new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'short' }).format(d);
    });
    days[4] = `اليوم (${new Date(this.now()).getDate()})`;
    return {
      chart: { type: 'areaspline', spacing: [10, 8, 4, 8] },
      legend: { enabled: false },
      tooltip: { shared: true, valueSuffix: ' حدث' },
      xAxis: { categories: days, lineColor: 'transparent', labels: { style: { color: '#64748b', fontSize: '11px' } } },
      yAxis: { visible: false, min: 150 },
      plotOptions: {
        areaspline: {
          lineWidth: 3, color: '#2563eb',
          fillColor: { linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 }, stops: [[0, 'rgba(37,99,235,0.28)'], [1, 'rgba(37,99,235,0)']] },
          marker: { radius: 5, fillColor: '#fff', lineColor: '#2563eb', lineWidth: 2 },
        },
      },
      series: [{ type: 'areaspline', name: 'الأحداث', data: this.store.s().trend }],
    };
  });

  // ── Map ────────────────────────────────────────────────
  protected readonly points = computed(() => MAP_POINTS.filter((p) => !this.hidden().includes(p.sector)));
  protected readonly layers = computed(() =>
    SECTOR_IDS.map((id) => ({ id, ar: id === 'traffic' ? 'المرور والحوادث' : id === 'security' ? 'الأمن العام والملاحظات' : id === 'municipal' ? 'البلاغات البلدية' : 'القيادة والتحكم', color: SECTORS[id].color, on: !this.hidden().includes(id) })),
  );
  protected toggleLayer(id: SectorId): void {
    this.hidden.update((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]));
  }
  protected showAll(): void {
    this.hidden.set([]);
  }
  protected zoomBy(f: number): void {
    this.zoom.update((z) => Math.min(2.5, Math.max(1, z * f)));
  }
  protected readonly mapTransform = computed(() => `translate(${400 - 400 * this.zoom()} ${330 - 330 * this.zoom()}) scale(${this.zoom()})`);
  protected readonly heatOpacity = computed(() => 0.45 + this.store.s().heat * 0.4);

  // ── Predictions ────────────────────────────────────────
  protected readonly predictions = computed(() => {
    const s = this.store.s();
    return [
      { id: 'p1', t: 'ارتفاع الازدحام المروري في 3 محاور رئيسية', icon: 'arrow_upward', c: '#dc2626' },
      { id: 'p2', t: 'زيادة كثافة الحشود حول الفعاليات المركزية', icon: 'arrow_upward', c: '#d97706' },
      { id: 'p3', t: `توقع انخفاض بلاغات الخدمات البلدية بنسبة ${Math.max(5, Math.round(s.municipal.fleet / 6.4))}%`, icon: 'arrow_downward', c: '#059669' },
      { id: 'p4', t: 'استقرار تام للبنية السحابية وشبكة الحساسات', icon: 'check', c: '#059669' },
    ];
  });

  protected readonly risks = computed(() => {
    const list = this.store.s().risks;
    return list.map((r, i) => {
      const level = r.count >= 110 ? 'high' : r.count >= 90 ? 'mid' : 'low';
      return { ...r, rank: i + 1, level, ar: level === 'high' ? 'مرتفع' : level === 'mid' ? 'متوسط' : 'منخفض' };
    });
  });

  protected readonly delayed = computed(() => {
    const d = this.store.s().delayed;
    return SECTOR_IDS.map((id) => ({ id, ar: SECTORS[id].ar, v: d[id] }));
  });

  protected readonly sla = computed(() => {
    const s = this.store.s().sla;
    return SECTOR_IDS.map((id) => ({ id, ar: id === 'traffic' ? 'قطاع المرور والنقل' : id === 'security' ? 'الأمن العام والشرطة' : id === 'municipal' ? 'الخدمات البلدية والبيئية' : 'القيادة والتحكم والأنظمة', v: s[id], color: SECTORS[id].color }));
  });

  protected readonly density = computed(() => (this.store.s().heat * 100).toFixed(0));
}
