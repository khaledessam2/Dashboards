import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, computed, effect, inject, input, viewChild } from '@angular/core';
import Highcharts from 'highcharts';
import 'highcharts/highcharts-more';
import { COLOR_GREEN } from '../../../../shared/constants/police.constants';
import { breachLevel, changePercent, incidentLevel } from '../../../../shared/utils/police.utils';

const GAUGE_LIMIT = 100;

/**
 * KPI-Documentation §3.2 — comparison gauge (current vs previous period).
 * `kind` picks the threshold table: incident (hour over hour) or breach (day over day).
 */
@Component({
  selector: 'app-police-compare-gauge',
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'card', '[style.--level]': 'level().color' },
  templateUrl: './compare-gauge.html',
})
export class PoliceCompareGauge {
  readonly title = input.required<string>();
  readonly currentLabel = input.required<string>();
  readonly previousLabel = input.required<string>();
  readonly current = input.required<number>();
  readonly previous = input.required<number>();
  readonly kind = input.required<'incident' | 'breach'>();

  private readonly container = viewChild.required<ElementRef<HTMLElement>>('chart');
  private chart?: Highcharts.Chart;

  protected readonly pct = computed(() => changePercent(this.current(), this.previous()));
  protected readonly level = computed(() => {
    const p = this.pct();
    return this.kind() === 'incident' ? incidentLevel(p) : breachLevel(p);
  });
  protected readonly pctText = computed(() => {
    const p = this.pct();
    return `${p > 0 ? '+' : ''}${p.toFixed(0)}%`;
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const css = getComputedStyle(document.body);
      const ink = css.getPropertyValue('--text').trim() || '#1f2937';
      const surface = css.getPropertyValue('--surface').trim() || '#ffffff';
      const chart = (this.chart = Highcharts.chart(this.container().nativeElement, {
        chart: { type: 'gauge', backgroundColor: 'transparent', spacing: [8, 10, 0, 10] },
        title: { text: undefined },
        credits: { enabled: false },
        legend: { enabled: false },
        tooltip: { enabled: false },
        pane: { startAngle: -90, endAngle: 90, center: ['50%', '88%'], size: '100%', background: [{ backgroundColor: 'transparent', borderWidth: 0, innerRadius: '0%', outerRadius: '100%' }] },
        yAxis: {
          min: -GAUGE_LIMIT,
          max: GAUGE_LIMIT,
          tickPositions: [-100, -50, -20, 20, 50, 100],
          tickLength: 8,
          tickWidth: 1,
          tickColor: 'var(--text-3)',
          tickPosition: 'outside',
          minorTickWidth: 0,
          labels: { distance: 14, style: { color: 'var(--text-3)', fontSize: '11px' } },
          // Thresholds: >+50 red, >+20 amber, ±20 green, below −20 cyan.
          plotBands: [
            { from: -100, to: -50, color: 'rgba(0,188,212,0.75)', thickness: 26 },
            { from: -50, to: -20, color: 'rgba(0,188,212,0.5)', thickness: 26 },
            { from: -20, to: 20, color: 'rgba(0,166,81,0.9)', thickness: 26 },
            { from: 20, to: 50, color: 'rgba(245,166,35,0.9)', thickness: 26 },
            { from: 50, to: 100, color: 'rgba(231,76,60,0.9)', thickness: 26 },
          ],
        },
        series: [
          {
            type: 'gauge',
            name: 'نسبة التغيّر',
            data: [0],
            dial: { radius: '80%', backgroundColor: ink, baseWidth: 4, topWidth: 1, baseLength: '0%', rearLength: '0%' },
            pivot: { radius: 8, backgroundColor: ink, borderWidth: 4, borderColor: surface },
            dataLabels: { enabled: false },
          },
        ],
      }));
      this.moveNeedle(this.pct());
      destroyRef.onDestroy(() => chart.destroy());
    });
    effect(() => this.moveNeedle(this.pct()));
  }

  private moveNeedle(pct: number): void {
    if (!this.chart) return;
    this.chart.series[0].points[0].update(Math.max(-GAUGE_LIMIT, Math.min(GAUGE_LIMIT, pct)));
  }
}
