import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, computed, effect, inject, viewChild } from '@angular/core';
import Highcharts from 'highcharts';
import 'highcharts/highcharts-more';
import { COLOR_GREEN } from '../../../../shared/constants/traffic.constants';
import { flowLevel, netFlowPercent } from '../../../../shared/utils/traffic.utils';
import { changePercent } from '../../../../shared/utils/police.utils';
import { TrafficStore } from '../../../../shared/services/traffic-store';

const GAUGE_LIMIT = 50;

@Component({
  selector: 'app-flow-gauge',
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'card', '[style.--level]': 'level().color' },
  templateUrl: './flow-gauge.html',
})
export class FlowGauge {
  private readonly container = viewChild.required<ElementRef<HTMLElement>>('chart');
  private readonly store = inject(TrafficStore);
  private chart?: Highcharts.Chart;

  protected readonly flow = this.store.flow;
  /** Total flow (entry + exit) change vs the previous day, %. */
  protected readonly change = computed(() => {
    const f = this.flow();
    const y = this.store.flowYesterday();
    return changePercent(f.entry + f.exit, y.entry + y.exit);
  });
  protected readonly net = computed(() => {
    const f = this.flow();
    return f ? netFlowPercent(f) : null;
  });
  protected readonly level = computed(() => {
    const n = this.net();
    return n === null ? { color: COLOR_GREEN, label: '—' } : flowLevel(n);
  });
  protected readonly netText = computed(() => {
    const n = this.net();
    if (n === null) return '—';
    return `${n > 0 ? '+' : ''}${n.toFixed(1)}%`;
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const css = getComputedStyle(document.body);
      const ink = css.getPropertyValue('--text').trim() || '#1f2937';
      const surface = css.getPropertyValue('--surface').trim() || '#ffffff';
      const chart = (this.chart = Highcharts.chart(this.container().nativeElement, {
        chart: { type: 'gauge', backgroundColor: 'transparent', spacing: [10, 10, 0, 10] },
        title: { text: undefined },
        credits: { enabled: false },
        legend: { enabled: false },
        tooltip: { enabled: false },
        pane: { startAngle: -90, endAngle: 90, center: ['50%', '88%'], size: '120%', background: [{ backgroundColor: 'transparent', borderWidth: 0, innerRadius: '0%', outerRadius: '100%' }] },
        yAxis: {
          min: -GAUGE_LIMIT,
          max: GAUGE_LIMIT,
          tickPositions: [-50, -30, -10, 10, 30, 50],
          tickLength: 8,
          tickWidth: 1,
          tickColor: 'var(--text-3)',
          tickPosition: 'outside',
          minorTickWidth: 0,
          labels: { distance: 14, style: { color: 'var(--text-3)', fontSize: '11px' } },
          // KPI-Documentation §2.2: ±30 red, ±10..30 amber, ±10 green.
          plotBands: [
            { from: -50, to: -30, color: 'rgba(231,76,60,0.9)', thickness: 26 },
            { from: -30, to: -10, color: 'rgba(245,166,35,0.9)', thickness: 26 },
            { from: -10, to: 10, color: 'rgba(0,166,81,0.9)', thickness: 26 },
            { from: 10, to: 30, color: 'rgba(245,166,35,0.9)', thickness: 26 },
            { from: 30, to: 50, color: 'rgba(231,76,60,0.9)', thickness: 26 },
          ],
        },
        series: [
          {
            type: 'gauge',
            name: 'صافي التدفق',
            data: [0],
            dial: { radius: '80%', backgroundColor: ink, baseWidth: 4, topWidth: 1, baseLength: '0%', rearLength: '0%' },
            pivot: { radius: 8, backgroundColor: ink, borderWidth: 4, borderColor: surface },
            dataLabels: { enabled: false },
          },
        ],
      }));
      this.moveNeedle(this.net());
      destroyRef.onDestroy(() => chart.destroy());
    });
    effect(() => this.moveNeedle(this.net()));
  }

  private moveNeedle(net: number | null): void {
    if (!this.chart || net === null) return;
    const clamped = Math.max(-GAUGE_LIMIT, Math.min(GAUGE_LIMIT, net));
    this.chart.series[0].points[0].update(clamped);
  }
}
