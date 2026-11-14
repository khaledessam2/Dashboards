import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, computed, effect, inject, signal, viewChild } from '@angular/core';
import Highcharts from 'highcharts';
import { PoliceStore } from '../../../../shared/services/police-store';

const COLORS = ['#00a651', '#00bcd4', '#f5a623', '#8b5cf6', '#5b6abf'];

function seriesOptions(name: string, color: string, data: number[]): Highcharts.SeriesAreasplineOptions {
  return {
    type: 'areaspline',
    name,
    color,
    data,
    fillColor: {
      linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
      stops: [
        [0, Highcharts.color(color).setOpacity(0.22).get('rgba') as string],
        [1, Highcharts.color(color).setOpacity(0).get('rgba') as string],
      ] as [number, string][],
    },
  };
}

@Component({
  selector: 'app-police-cam-ranking',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { id: 'cam-ranking', class: 'card' },
  templateUrl: './cam-ranking.html',
})

export class PoliceCamRanking {
  private readonly container = viewChild.required<ElementRef<HTMLElement>>('chart');
  private readonly store = inject(PoliceStore);

  private chart?: Highcharts.Chart;
  protected readonly hidden = signal<ReadonlySet<number>>(new Set());

  /** Top 5 cameras by event count, with their hourly series. */
  protected readonly lines = computed(() =>
    this.store.cameraSeries().map((s, i) => ({ name: s.name, color: COLORS[i % COLORS.length], total: s.total, data: s.data })),
  );

  protected toggle(index: number): void {
    const series = this.chart?.series[index];
    if (!series) return;
    series.setVisible(!series.visible);
    this.hidden.set(new Set(this.chart!.series.filter((s) => !s.visible).map((s) => s.index)));
  }

  protected highlight(index: number | null): void {
    this.chart?.series.forEach((s) => {
      if (!s.visible) return;
      s.setState(index === null || s.index === index ? 'normal' : 'inactive');
      s.group?.attr({ opacity: index === null || s.index === index ? 1 : 0.2 });
    });
  }

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const chart = (this.chart = Highcharts.chart(this.container().nativeElement, {
        chart: { type: 'areaspline', backgroundColor: 'transparent', spacing: [8, 8, 0, 0] },
        title: { text: undefined },
        credits: { enabled: false },
        legend: { enabled: false },
        xAxis: {
          categories: [],
          tickInterval: 3,
          tickLength: 0,
          lineColor: 'var(--grid)',
          crosshair: { width: 1, color: 'var(--text-2)', dashStyle: 'Dash' },
          labels: { style: { color: 'var(--text-2)', fontSize: '12px' , fontWeight:'bold' } },
        },
        yAxis: {
          title: { text: undefined },
          min: 0,
          allowDecimals: false,
          gridLineDashStyle: 'Dash',
          gridLineColor: 'var(--grid)',
          labels: { style: { color: 'var(--text-2)', fontSize: '12px' , fontWeight:'bold' } },
        },
        tooltip: {
          shared: true,
          useHTML: true,
          backgroundColor: 'transparent',
          borderWidth: 0,
          shadow: false,
          padding: 0,
          formatter() {
            const rows = [...(this.points ?? [])]
              .sort((a, b) => (b.y ?? 0) - (a.y ?? 0))
              .map(
                (p) => `<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;padding:2px 0">
                  <span style="display:flex;align-items:center;gap:8px"><i style="width:8px;height:8px;border-radius:50%;background:${p.color}"></i>${p.series.name}</span>
                  <b style="font-variant-numeric:tabular-nums">${p.y}</b></div>`,
              )
              .join('');
            return `<div dir="rtl" style="min-width:150px;padding:10px 12px;border-radius:12px;font-size:12px;color:var(--text);background:var(--surface,#fff);border:1px solid var(--border,#e5e7eb);box-shadow:0 8px 24px rgba(15,23,42,.14)">
              <div style="margin-bottom:6px;font-size:11px;color:var(--text-3)">${this.category}</div>${rows}</div>`;
          },
        },
        plotOptions: {
          areaspline: {
            lineWidth: 2.5,
            states: { hover: { lineWidthPlus: 0 } },
            marker: { enabled: false, radius: 4, lineWidth: 2, lineColor: '#ffffff', states: { hover: { enabled: true } } },
          },
        },
        series: [],
      }));
      this.apply();
      destroyRef.onDestroy(() => chart.destroy());
    });
    effect(() => {
      this.lines();
      this.store.hourly();
      this.apply();
    });
  }

  private apply(): void {
    const chart = this.chart;
    if (!chart) return;
    const lines = this.lines();
    chart.xAxis[0].setCategories(this.store.hourly().map((b) => b.label), false);

    if (chart.series.length !== lines.length) {
      while (chart.series.length) chart.series[0].remove(false);
      lines.forEach((l) => chart.addSeries(seriesOptions(l.name, l.color, l.data), false));
      this.hidden.set(new Set());
    } else {
      lines.forEach((l, i) => {
        const options = seriesOptions(l.name, l.color, l.data);
        chart.series[i].update({ type: 'areaspline', name: options.name, color: options.color, fillColor: options.fillColor }, false);
        chart.series[i].setData(l.data, false, false);
      });
    }
    chart.redraw(false);
  }
}
