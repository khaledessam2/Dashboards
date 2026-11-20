import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, computed, inject, input, model, signal } from '@angular/core';
import type Highcharts from 'highcharts';
import { TONE_HEX, Tone } from '../../../services/traffic-ops-store';
import { HcChart } from '../hc-chart/hc-chart';

export interface MapMarker {
  x: number;
  y: number;
  tone: Tone;
  icon: string;
  label: string;
}

type PillTone = 'gray' | 'orange' | 'red' | 'green';
interface Pill { x: number; y: number; t: string; tone: PillTone }
const PILL: Record<PillTone, { stroke: string; fg: string }> = {
  gray: { stroke: '#cbd5e1', fg: '#475569' },
  orange: { stroke: '#f5a623', fg: '#b45309' },
  red: { stroke: '#e74c3c', fg: '#b91c1c' },
  green: { stroke: '#00a651', fg: '#047857' },
};

/** Districts and arterial roads of Madinah on a 700 × 540 plane. */
const SCENE_PILLS: Pill[] = [
  { x: 330, y: 44, t: 'جبل أحد', tone: 'gray' },
  { x: 225, y: 150, t: 'حي سلطانة', tone: 'gray' },
  { x: 120, y: 166, t: 'طريق سلطانة', tone: 'gray' },
  { x: 170, y: 212, t: 'حي العيون', tone: 'red' },
  { x: 90, y: 260, t: 'حي العزيزية', tone: 'red' },
  { x: 556, y: 220, t: 'حي بني حارثة', tone: 'orange' },
  { x: 596, y: 256, t: 'طريق الملك عبدالعزيز', tone: 'red' },
  { x: 551, y: 330, t: 'حي العريض', tone: 'gray' },
  { x: 266, y: 346, t: 'حي الجمعة', tone: 'orange' },
  { x: 225, y: 424, t: 'حي النصر', tone: 'gray' },
  { x: 134, y: 420, t: 'طريق الهجرة', tone: 'gray' },
  { x: 410, y: 424, t: 'طريق قباء', tone: 'gray' },
  { x: 478, y: 450, t: 'حي شوران', tone: 'orange' },
  { x: 357, y: 128, t: 'طريق الملك عبدالله (الدائري الثاني)', tone: 'orange' },
  { x: 342, y: 196, t: 'طريق الملك فيصل (الدائري الأول)', tone: 'red' },
  { x: 350, y: 311, t: 'المسجد النبوي الشريف', tone: 'green' },
  { x: 357, y: 462, t: 'مسجد قباء', tone: 'green' },
];

/** Traffic-tab scene: blue camera markers around the rings. */
const FLOW_CAMERAS: [number, number][] = [[188, 231], [495, 197], [505, 343]];

const CX = 350;
const CY = 270;
const ellipse = (rx: number, ry: number): [number, number][] =>
  Array.from({ length: 91 }, (_, i): [number, number] => [CX + rx * Math.cos((i * Math.PI) / 45), CY + ry * Math.sin((i * Math.PI) / 45)]);
/** Arc of a circle; angles in degrees, clockwise from the +x axis (y grows downward). */
const arc = (r: number, from: number, to: number): [number, number][] =>
  Array.from({ length: 41 }, (_, i): [number, number] => {
    const a = ((from + ((to - from) * i) / 40) * Math.PI) / 180;
    return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
  });
/** Straight spoke between two radii at an angle. */
const spoke = (angle: number, r0: number, r1: number): [number, number][] => {
  const a = (angle * Math.PI) / 180;
  return [[CX + r0 * Math.cos(a), CY + r0 * Math.sin(a)], [CX + r1 * Math.cos(a), CY + r1 * Math.sin(a)]];
};

const pillHtml = (text: string, stroke: string, fg: string): string =>
  `<span style="display:inline-block;padding:2px 10px;border-radius:999px;background:#fff;border:1.6px solid ${stroke};color:${fg};font:600 11.5px Cairo,sans-serif;white-space:nowrap">${text}</span>`;

const darkPillHtml = (text: string, icon = ''): string =>
  `<span style="display:inline-flex;align-items:center;gap:6px;padding:3px 12px;border-radius:8px;background:#1c2434;color:#fff;font:600 12px Cairo,sans-serif;white-space:nowrap">${text}${icon ? `<span class="material-symbols-outlined" style="font-size:16px;color:#f5a623">${icon}</span>` : ''}</span>`;

const speedCardHtml = (name: string, speed: string, color: string, icon: string): string =>
  `<span style="display:inline-flex;align-items:center;gap:6px;background:#fff;border-radius:10px;padding:4px 10px;border-right:4px solid ${color};box-shadow:0 2px 8px rgba(0,0,0,.16);font:600 12px Cairo,sans-serif;color:#1c2434;white-space:nowrap"><span class="material-symbols-outlined" style="font-size:20px;color:${color}">${icon}</span>${name}${speed ? `<b style="background:${color}22;color:${color};border-radius:6px;padding:0 6px">${speed}</b>` : ''}</span>`;

const districtHtml = (name: string, color: string): string =>
  `<span style="display:inline-flex;align-items:center;gap:6px;background:#fff;border-radius:8px;padding:3px 10px;box-shadow:0 2px 8px rgba(0,0,0,.18);font:600 12px Cairo,sans-serif;color:#1c2434;white-space:nowrap">${name}<i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color}"></i></span>`;

const tagHtml = (text: string): string =>
  `<span style="display:inline-block;padding:2px 10px;border-radius:6px;background:#334155;color:#fff;font:600 12px Cairo,sans-serif;white-space:nowrap">${text}</span>`;

const iconDot = (icon: string, size = 18): string => `<span class="material-symbols-outlined" style="font-size:${size}px;color:#fff">${icon}</span>`;

/** Incidents-tab scene is laid out in the mockup's pixel space (386 × 386); convert it onto the 700 × 540 plane. */
const ix = (x: number): number => 80 + x * 1.4;
const iy = (y: number): number => y * 1.4;

const MOSQUE = (size: number, color: string): string => `<span class="material-symbols-outlined" style="font-size:${size}px;color:${color}">mosque</span>`;

/**
 * Map of Madinah drawn with Highcharts. All series share one plane, so every label stays attached
 * to its place at any size. Scenes: "full" (overview: districts, heat, legend), "flow" (traffic tab:
 * speed cards + cameras), "forecast" (forecast tab: congestion-level rings) and "basic" (light).
 */
@Component({
  selector: 'app-ops-map',
  imports: [HcChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative block min-h-[420px] flex-1 overflow-hidden rounded-lg' },
  templateUrl: './ops-map.html',
})
export class OpsMap {
  readonly markers = input.required<MapMarker[]>();
  readonly center = input<string>('المسجد النبوي');
  readonly heat = input<boolean>(false);
  readonly scene = input<'full' | 'basic' | 'flow' | 'forecast' | 'incidents'>('basic');
  readonly chip = input<string>('كثافة عالية: المركزية');

  protected readonly zoom = signal(1);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Levels hidden by the legend ("ok" | "warn" | "high" | "crit"). Two-way so tabs can drive it from their own legends. */
  readonly hidden = model<string[]>([]);
  protected readonly levels = [
    { id: 'ok', ar: 'منخفض (0% - 40%)', color: '#00a651' },
    { id: 'warn', ar: 'متوسط (41% - 70%)', color: '#fbbf24' },
    { id: 'high', ar: 'مرتفع (71% - 85%)', color: '#f97316' },
    { id: 'crit', ar: 'حرج (86% - 100%)', color: '#ef4444' },
  ];
  protected readonly heatLevels = [
    { id: 'ok', ar: 'انسيابي', fg: '#15803d' },
    { id: 'warn', ar: 'متوسط', fg: '#f59e0b' },
    { id: 'high', ar: 'كثيف', fg: '#f97316' },
    { id: 'crit', ar: 'حرج / اختناق', fg: '#dc2626' },
  ];
  protected off(level: string): boolean {
    return this.hidden().includes(level);
  }
  protected toggle(level: string): void {
    this.hidden.update((h) => (h.includes(level) ? h.filter((x) => x !== level) : [...h, level]));
  }

  /** Card size in px → the plane is fitted to it, so the map fills the card without an empty band. */
  private readonly size = signal({ w: 0, h: 0 });

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const ro = new ResizeObserver((entries) => {
        const r = entries[0].contentRect;
        this.size.set({ w: Math.round(r.width), h: Math.round(r.height) });
      });
      ro.observe(this.host.nativeElement);
      destroyRef.onDestroy(() => ro.disconnect());
    });
  }

  /** Visible part of the plane for each scene (what really holds content). */
  private bounds(): { x0: number; x1: number; y0: number; y1: number } {
    switch (this.scene()) {
      case 'incidents':
        return { x0: 80, x1: 620, y0: 10, y1: 530 };
      case 'forecast':
        return { x0: 20, x1: 680, y0: 40, y1: 500 };
      case 'flow':
        return { x0: 0, x1: 700, y0: 25, y1: 515 };
      default:
        return { x0: 0, x1: 700, y0: 28, y1: 512 };
    }
  }

  protected zoomBy(factor: number): void {
    this.zoom.update((z) => Math.min(3, Math.max(1, z * factor)));
  }
  protected fullscreen(): void {
    void this.host.nativeElement.requestFullscreen?.();
  }

  protected readonly options = computed<Highcharts.Options>(() => {
    switch (this.scene()) {
      case 'flow':
        return this.flowOptions();
      case 'forecast':
        return this.forecastOptions();
      case 'incidents':
        return this.incidentsOptions();
      default:
        return this.sceneOptions();
    }
  });

  private readonly quiet = { enableMouseTracking: false, states: { inactive: { opacity: 1 }, hover: { enabled: false } } };

  private base(series: Highcharts.SeriesOptionsType[]): Highcharts.Options {
    const { x0, x1, y0, y1 } = this.bounds();
    const W = this.size().w || 700;
    const H = this.size().h || 540;
    const k = Math.min(W / (x1 - x0), H / (y1 - y0)) * this.zoom();
    const hw = W / (2 * k);
    const hh = H / (2 * k);
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    return {
      chart: { type: 'scatter', margin: [0, 0, 0, 0], spacing: [0, 0, 0, 0], backgroundColor: 'transparent', animation: false },
      legend: { enabled: false },
      xAxis: { min: mx - hw, max: mx + hw, visible: false, startOnTick: false, endOnTick: false, tickLength: 0, lineWidth: 0 },
      yAxis: { min: my - hh, max: my + hh, visible: false, reversed: true, startOnTick: false, endOnTick: false, gridLineWidth: 0 },
      tooltip: { shared: false, headerFormat: '', pointFormat: '<b>{point.name}</b>' },
      plotOptions: { series: { animation: false, states: { inactive: { enabled: false } } }, scatter: { stickyTracking: false } },
      series,
    };
  }

  private line(name: string, data: number[][], color: string, width = 6, extra: Record<string, unknown> = {}): Highcharts.SeriesOptionsType {
    return { type: 'line', name, data, color, lineWidth: width, marker: { enabled: false }, linecap: 'round', ...this.quiet, ...extra } as Highcharts.SeriesOptionsType;
  }

  private heatLayers(x: number, y: number, r: number, rgb: string): Highcharts.PointOptionsObject[] {
    return [1, 0.66, 0.36].map((k, i) => ({ x, y, marker: { radius: r * k, fillColor: `rgba(${rgb},${[0.12, 0.18, 0.26][i]})` } }));
  }

  /** Overview ("full") and light ("basic") scenes. */
  private sceneOptions(): Highcharts.Options {
    const full = this.scene() === 'full';
    const quiet = this.quiet;
    const heatSeries: Highcharts.SeriesOptionsType[] = this.heat()
      ? [
          { type: 'scatter', name: 'heat-crit', ...quiet, marker: { symbol: 'circle', lineWidth: 0 }, data: [...this.heatLayers(350, 270, 120, '231,76,60'), ...this.heatLayers(500, 268, 72, '231,76,60')] } as Highcharts.SeriesOptionsType,
          { type: 'scatter', name: 'heat-high', ...quiet, marker: { symbol: 'circle', lineWidth: 0 }, data: [...this.heatLayers(212, 262, 68, '245,166,35'), ...this.heatLayers(300, 330, 46, '245,166,35')] } as Highcharts.SeriesOptionsType,
        ]
      : [];

    const pillLevel: Record<PillTone, string> = { red: 'crit', orange: 'high', green: 'ok', gray: '' };
    const pillPoints = (full ? SCENE_PILLS : []).filter((p) => !this.off(pillLevel[p.tone])).map((p) => ({ x: p.x, y: p.y, name: p.t, custom: PILL[p.tone] }));
    const markers = this.markers().filter((m) => !this.off(m.tone)).map((m) => ({
      x: (m.x / 100) * 700,
      y: (m.y / 100) * 540,
      name: m.label,
      color: TONE_HEX[m.tone],
      dataLabels:
        m.icon === 'warning' || m.icon === 'car_crash' || m.icon === 'block'
          ? { enabled: true, useHTML: true, allowOverlap: true, verticalAlign: 'middle', y: 0, format: '<b style="color:#fff;font-size:13px">!</b>', style: { textOutline: 'none' } }
          : { enabled: !full, useHTML: true, allowOverlap: true, verticalAlign: 'middle', y: 24, formatter: function (this: Highcharts.Point) { return pillHtml(this.name, '#e2e8f0', '#1c2434'); } },
    }));

    const levelOfSeries: Record<string, string> = {
      'ring-outer': 'ok', 'ring-mid': 'high', 'ring-inner': 'crit', 'ring-inner-dash': 'crit',
      'road-1': 'crit', 'road-2': 'crit', 'road-3': 'high', 'road-4': 'high', 'road-5': 'ok', 'road-6': 'ok', 'road-7': 'high',
      'heat-crit': 'crit', 'heat-high': 'high',
    };
    const series: Highcharts.SeriesOptionsType[] = [
      { type: 'polygon', name: 'mountain', color: 'rgba(203,213,225,0.85)', borderWidth: 0, ...quiet, data: [[60, 110], [130, 52], [330, 36], [560, 52], [650, 118], [560, 132], [330, 96], [130, 128]] } as Highcharts.SeriesOptionsType,
      ...heatSeries,
      this.line('ring-outer', ellipse(335, 228), '#00a651', 3),
      this.line('ring-mid', ellipse(215, 140), '#f5a623', 3.5),
      this.line('ring-inner', ellipse(108, 74), '#e74c3c', 5),
      this.line('ring-inner-dash', ellipse(108, 74), '#ffffff', 1.4, { dashStyle: 'Dot' }),
      this.line('road-1', [[0, 273], [250, 270]], '#e74c3c'),
      this.line('road-2', [[440, 266], [700, 262]], '#e74c3c'),
      this.line('road-3', [[350, 50], [350, 200]], '#f5a623'),
      this.line('road-4', [[10, 118], [200, 205]], '#f97316'),
      this.line('road-5', [[530, 205], [700, 112]], '#00a651'),
      this.line('road-6', [[30, 455], [260, 340]], '#00a651'),
      this.line('road-7', [[358, 345], [350, 480]], '#f97316'),
      {
        type: 'scatter', name: 'centre', enableMouseTracking: false, data: [{ x: 350, y: 270 }],
        marker: { symbol: 'circle', radius: 34, fillColor: '#ffffff', lineColor: '#00a651', lineWidth: 3 },
        dataLabels: { enabled: true, useHTML: true, allowOverlap: true, verticalAlign: 'middle', y: 0, format: MOSQUE(34, '#00a651') },
      } as Highcharts.SeriesOptionsType,
      {
        type: 'scatter', name: 'labels', enableMouseTracking: false, data: pillPoints, marker: { enabled: false },
        dataLabels: {
          enabled: true, useHTML: true, allowOverlap: true, verticalAlign: 'middle', crop: false, overflow: 'allow', y: 0,
          formatter: function (this: Highcharts.Point) {
            const c = (this as unknown as { options: { custom: { stroke: string; fg: string } } }).options.custom;
            return pillHtml(this.name, c.stroke, c.fg);
          },
        },
      } as Highcharts.SeriesOptionsType,
      { type: 'scatter', name: 'markers', data: markers, marker: { symbol: 'circle', radius: 11, lineWidth: 3, lineColor: '#ffffff' } } as Highcharts.SeriesOptionsType,
      ...(full
        ? []
        : [
            {
              type: 'scatter', name: 'centre-label', enableMouseTracking: false, marker: { enabled: false }, data: [{ x: 350, y: 312, name: this.center() }],
              dataLabels: { enabled: true, useHTML: true, allowOverlap: true, verticalAlign: 'middle', formatter: function (this: Highcharts.Point) { return darkPillHtml(this.name); } },
            } as Highcharts.SeriesOptionsType,
          ]),
    ];
    return this.base(series.filter((x) => !this.off(levelOfSeries[x.name ?? ''] ?? '')));
  }

  /** Traffic tab: dotted green outer ring, orange + red rings, speed cards, blue cameras. */
  private flowOptions(): Highcharts.Options {
    const quiet = this.quiet;
    const cards = this.markers().filter((m) => !this.off(m.tone)).map((m) => {
      const [name, speed] = m.label.split(' · ');
      const color = TONE_HEX[m.tone];
      const icon = m.tone === 'crit' ? 'car_crash' : 'warning';
      return { x: (m.x / 100) * 700, y: (m.y / 100) * 540, name: m.label, custom: { html: speedCardHtml(name, speed ?? '', color, icon) } };
    });
    return this.base([
      { type: 'polygon', name: 'mountain', color: 'rgba(203,213,225,0.7)', borderWidth: 0, ...quiet, data: [[60, 110], [150, 52], [330, 36], [560, 52], [650, 118], [560, 132], [330, 96], [150, 128]] } as Highcharts.SeriesOptionsType,
      ...(this.heat()
        ? [
            {
              type: 'scatter', name: 'heat', ...quiet, marker: { symbol: 'circle', lineWidth: 0 },
              data: [...this.heatLayers(350, 270, 110, '231,76,60'), ...this.heatLayers(212, 262, 62, '245,166,35'), ...this.heatLayers(500, 268, 66, '231,76,60')],
            } as Highcharts.SeriesOptionsType,
          ]
        : []),
      this.line('ring-outer', ellipse(345, 235), '#10b981', 5, { dashStyle: 'Dot' }),
      this.line('ring-mid', ellipse(250, 160), '#f5a623', 4),
      this.line('ring-inner', ellipse(150, 98), '#e74c3c', 6),
      this.line('ring-inner-dash', ellipse(150, 98), '#ffffff', 1.4, { dashStyle: 'Dot' }),
      {
        type: 'scatter', name: 'centre', enableMouseTracking: false, data: [{ x: 350, y: 262 }],
        marker: { symbol: 'circle', radius: 44, fillColor: 'rgba(0,166,81,0.10)', lineWidth: 0 },
        dataLabels: { enabled: true, useHTML: true, allowOverlap: true, verticalAlign: 'middle', y: 0, format: MOSQUE(36, '#00a651') },
      } as Highcharts.SeriesOptionsType,
      {
        type: 'scatter', name: 'centre-label', enableMouseTracking: false, marker: { enabled: false }, data: [{ x: 350, y: 312, name: this.center() }],
        dataLabels: { enabled: true, useHTML: true, allowOverlap: true, verticalAlign: 'middle', formatter: function (this: Highcharts.Point) { return darkPillHtml(this.name); } },
      } as Highcharts.SeriesOptionsType,
      {
        type: 'scatter', name: 'cameras', data: FLOW_CAMERAS.map(([x, y]) => ({ x, y, name: 'كاميرا مراقبة' })),
        marker: { symbol: 'circle', radius: 15, fillColor: '#2563eb', lineColor: '#ffffff', lineWidth: 3 },
        dataLabels: { enabled: true, useHTML: true, allowOverlap: true, verticalAlign: 'middle', y: 0, format: '<span class="material-symbols-outlined" style="font-size:18px;color:#fff">videocam</span>' },
      } as Highcharts.SeriesOptionsType,
      {
        type: 'scatter', name: 'speed-cards', enableMouseTracking: false, marker: { enabled: false }, data: cards,
        dataLabels: {
          enabled: true, useHTML: true, allowOverlap: true, verticalAlign: 'middle', crop: false, overflow: 'allow', y: 0,
          formatter: function (this: Highcharts.Point) {
            return (this as unknown as { options: { custom: { html: string } } }).options.custom.html;
          },
        },
      } as Highcharts.SeriesOptionsType,
    ]);
  }

/** Incidents tab: light street grid, dashed ring, green arterials, dark name tags, incident markers. */
  private incidentsOptions(): Highcharts.Options {
    const quiet = this.quiet;
    const P = (pts: [number, number][]): number[][] => pts.map(([x, y]) => [ix(x), iy(y)]);
    const arcAt = (cx: number, cy: number, r: number, from: number, to: number): number[][] =>
      Array.from({ length: 31 }, (_, i) => {
        const a = ((from + ((to - from) * i) / 30) * Math.PI) / 180;
        return [ix(cx + r * Math.cos(a)), iy(cy + r * Math.sin(a))];
      });
    const ring = Array.from({ length: 91 }, (_, i) => {
      const a = (i * Math.PI) / 45;
      return [ix(190 + 120 * Math.cos(a)), iy(162 + 78 * Math.sin(a))];
    });

    const tags = [
      { x: 182, y: 28, t: 'العزيزية' }, { x: 66, y: 114, t: 'الزاهر' }, { x: 92, y: 74, t: 'جرول' }, { x: 282, y: 73, t: 'المسفلة' },
      { x: 314, y: 113, t: 'الششة' }, { x: 96, y: 306, t: 'العوالي' }, { x: 183, y: 331, t: 'المعابدة' },
    ].map((p) => ({ x: ix(p.x), y: iy(p.y), name: p.t }));

    const dot = (x: number, y: number, name: string, color: string, icon: string) => ({
      x: ix(x), y: iy(y), name, color,
      dataLabels: { enabled: true, useHTML: true, allowOverlap: true, verticalAlign: 'middle', y: 0, format: iconDot(icon) },
    });

    const levelOfSeries: Record<string, string> = {
      'road-nw': 'ok', 'road-ne': 'ok', 'road-w-top': 'ok', 'road-s': 'ok', 'road-sw': 'ok', 'road-e-green': 'ok',
      'road-w': 'warn', 'arc-orange': 'warn', 'arc-red': 'crit', 'road-e-red': 'crit',
    };
    const series: Highcharts.SeriesOptionsType[] = [
      // faint street outlines
      this.line('street-1', P([[120, 40], [155, 85], [165, 150]]), '#e2e8f0', 1.5),
      this.line('street-2', P([[48, 290], [60, 322]]), '#e2e8f0', 1.5),
      this.line('street-3', P([[250, 280], [330, 300]]), '#e2e8f0', 1.5),
      this.line('street-4', P([[20, 250], [120, 215]]), '#e2e8f0', 1.5),
      this.line('ring-dashed', ring, '#94a3b8', 2, { dashStyle: 'Dash' }),
      // green arterials
      this.line('road-nw', P([[93, 75], [165, 165]]), '#22c55e', 7),
      this.line('road-ne', P([[330, 57], [205, 160]]), '#22c55e', 7),
      { ...this.line('road-w-top', P([[0, 142], [70, 160]]), '#22c55e', 7), name: 'road-w-top' },
      this.line('road-s', P([[205, 205], [270, 325]]), '#22c55e', 7),
      this.line('road-sw', P([[125, 318], [185, 232]]), '#22c55e', 7),
      this.line('road-e-green', P([[300, 185], [386, 205]]), '#22c55e', 7),
      // orange / red congestion around the mosque
      this.line('road-w', P([[68, 185], [131, 189]]), '#f5a623', 7),
      this.line('arc-orange', arcAt(190, 162, 46, 200, 345), '#f5a623', 7),
      this.line('arc-red', arcAt(190, 162, 46, 95, 205), '#ef4444', 7),
      this.line('road-e-red', P([[228, 160], [300, 185]]), '#ef4444', 7),
      // red halo behind the crash marker
      { type: 'scatter', name: 'halo', ...quiet, marker: { symbol: 'circle', radius: 26, fillColor: 'rgba(239,68,68,0.28)', lineWidth: 0 }, data: [{ x: ix(250), y: iy(108) }] } as Highcharts.SeriesOptionsType,
      // centre: Al-Masjid an-Nabawi
      {
        type: 'scatter', name: 'centre', enableMouseTracking: false, data: [{ x: ix(190), y: iy(162) }],
        marker: { symbol: 'circle', radius: 20, fillColor: '#00a651', lineColor: '#ffffff', lineWidth: 3 },
        dataLabels: { enabled: true, useHTML: true, allowOverlap: true, verticalAlign: 'middle', y: 0, format: iconDot('mosque', 22) },
      } as Highcharts.SeriesOptionsType,
      {
        type: 'scatter', name: 'centre-label', enableMouseTracking: false, marker: { enabled: false }, data: [{ x: ix(190), y: iy(188), name: 'المسجد النبوي' }],
        dataLabels: { enabled: true, useHTML: true, allowOverlap: true, verticalAlign: 'middle', formatter: function (this: Highcharts.Point) { return darkPillHtml(this.name); } },
      } as Highcharts.SeriesOptionsType,
      // incidents
      {
        type: 'scatter', name: 'incidents',
        marker: { symbol: 'circle', radius: 17, lineWidth: 3, lineColor: '#ffffff' },
        data: [
          dot(250, 108, 'حادث مروري - الملك عبدالعزيز', '#ef4444', 'car_crash'),
          dot(228, 198, 'حادث مروري', '#ef4444', 'car_crash'),
          dot(146, 134, 'ازدحام شديد', '#f59e0b', 'warning'),
          dot(139, 218, 'أعمال صيانة طارئة', '#f59e0b', 'warning'),
          dot(193, 233, 'دورية', '#2563eb', 'directions_car'),
          dot(288, 217, 'إغلاق جزئي', '#b91c1c', 'block'),
        ].filter((d) => !this.off(d.color === '#f59e0b' ? 'warn' : d.color === '#2563eb' ? '' : 'crit')),
      } as Highcharts.SeriesOptionsType,
      // dark area tags
      {
        type: 'scatter', name: 'area-tags', enableMouseTracking: false, marker: { enabled: false }, data: tags,
        dataLabels: { enabled: true, useHTML: true, allowOverlap: true, verticalAlign: 'middle', crop: false, overflow: 'allow', y: 0, formatter: function (this: Highcharts.Point) { return tagHtml(this.name); } },
      } as Highcharts.SeriesOptionsType,
    ];
    return this.base(series.filter((x) => !this.off(levelOfSeries[x.name ?? ''] ?? '')));
  }

  
  /** Forecast tab: coloured congestion rings, spokes, districts with a level dot. */
  private forecastOptions(): Highcharts.Options {
    const quiet = this.quiet;
    const districts = this.markers().filter((m) => !this.off(m.tone)).map((m) => ({ x: (m.x / 100) * 700, y: (m.y / 100) * 540, name: m.label, custom: { html: districtHtml(m.label, TONE_HEX[m.tone]) } }));
    return this.base([
      this.line('diag-1', [[10, 20], [690, 520]], '#e2e8f0', 1.5, { dashStyle: 'Dot' }),
      this.line('diag-2', [[10, 520], [690, 20]], '#e2e8f0', 1.5, { dashStyle: 'Dot' }),
      this.line('spoke-ne', spoke(-45, 40, 215), '#cbd5e1', 2, { dashStyle: 'Dot' }),
      this.line('spoke-nw', spoke(-135, 40, 215), '#ef4444', 6),
      this.line('spoke-sw', spoke(135, 40, 215), '#22c55e', 6),
      this.line('spoke-se', spoke(45, 40, 215), '#22c55e', 6),
      this.line('spoke-n', spoke(-90, 40, 215), '#f97316', 6),
      this.line('spoke-s', spoke(90, 40, 215), '#f97316', 6),
      this.line('spoke-w', spoke(180, 40, 215), '#f97316', 6),
      this.line('spoke-e', spoke(0, 40, 215), '#eab308', 6),
      this.line('ring-outer', arc(215, 0, 360), '#4ade80', 7),
      this.line('ring-outer-top', arc(215, 205, 335), '#eab308', 7),
      this.line('ring-mid', arc(160, 0, 360), '#f97316', 9),
      this.line('ring-mid-top', arc(160, 215, 325), '#fb923c', 9),
      this.line('ring-inner-glow', arc(100, 0, 360), 'rgba(239,68,68,0.22)', 24),
      this.line('ring-inner', arc(100, 0, 360), '#ef4444', 8),
      {
        type: 'scatter', name: 'centre', enableMouseTracking: false, data: [{ x: 350, y: 270 }],
        marker: { symbol: 'circle', radius: 30, fillColor: '#ffffff', lineColor: '#dc2626', lineWidth: 2 },
        dataLabels: { enabled: true, useHTML: true, allowOverlap: true, verticalAlign: 'middle', y: 0, format: MOSQUE(30, '#1d4ed8') },
      } as Highcharts.SeriesOptionsType,
      {
        type: 'scatter', name: 'centre-label', enableMouseTracking: false, marker: { enabled: false }, data: [{ x: 350, y: 312, name: this.center() }],
        dataLabels: { enabled: true, useHTML: true, allowOverlap: true, verticalAlign: 'middle', formatter: function (this: Highcharts.Point) { return darkPillHtml(this.name, 'mosque'); } },
      } as Highcharts.SeriesOptionsType,
      {
        type: 'scatter', name: 'districts', marker: { enabled: false }, data: districts, ...quiet,
        dataLabels: {
          enabled: true, useHTML: true, allowOverlap: true, verticalAlign: 'middle', crop: false, overflow: 'allow', y: 0,
          formatter: function (this: Highcharts.Point) {
            return (this as unknown as { options: { custom: { html: string } } }).options.custom.html;
          },
        },
      } as Highcharts.SeriesOptionsType,
    ]);
  }
}
