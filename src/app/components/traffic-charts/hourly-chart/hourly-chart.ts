import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, effect, inject, viewChild } from '@angular/core';
import Highcharts from 'highcharts';
import { HourBucket } from '../../../shared/models/traffic-stats.model';
import { activityColor } from '../../../shared/utils/traffic.utils';
import { TrafficStore } from '../../../shared/services/traffic-store';

@Component({
  selector: 'app-hourly-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { id: 'hourly-events', class: 'card' },
  templateUrl: './hourly-chart.html',
})
export class HourlyChart {
  private readonly container = viewChild.required<ElementRef<HTMLElement>>('chart');
  private readonly store = inject(TrafficStore);
  private chart?: Highcharts.Chart;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const chart = (this.chart = Highcharts.chart(this.container().nativeElement, {
        chart: { type: 'column', backgroundColor: 'transparent', spacing: [8, 8, 0, 0] },
        title: { text: undefined },
        credits: { enabled: false },
        legend: { enabled: false },
        xAxis: {
          categories: [],
          tickInterval: 3,
          lineColor: 'transparent',
          tickLength: 0,
          labels: { style: { color: 'var(--text-2)', fontSize: '13px' , fontWeight:'600' } },
        },
        yAxis: {
          title: { text: undefined },
          min: 0,
          allowDecimals: false,
          gridLineDashStyle: 'Dash',
          gridLineColor: 'var(--grid)',
          labels: { style: { color: 'var(--text-2)', fontSize: '13px' , fontWeight:'600' } },
        },
        tooltip: { headerFormat: '', pointFormat: '{point.category} — <b>{point.y}</b>' },
        plotOptions: { column: { borderWidth: 0, borderRadius: 3, pointPadding: 0.1, groupPadding: 0.1, maxPointWidth: 16 } },
        series: [{ type: 'column', name: 'الأحداث', data: [] }],
      }));
      this.apply(this.store.hourly());
      destroyRef.onDestroy(() => chart.destroy());
    });
    effect(() => this.apply(this.store.hourly()));
  }

  private apply(buckets: HourBucket[]): void {
    if (!this.chart) return;
    const max = Math.max(1, ...buckets.map((b) => b.count));
    this.chart.xAxis[0].setCategories(buckets.map((b) => b.label), false);
    this.chart.series[0].setData(
      buckets.map((b) => ({ y: b.count, color: activityColor(b.count, max) })),
      true,
      false,
    );
  }
}
