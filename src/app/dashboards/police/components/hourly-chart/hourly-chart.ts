import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import type Highcharts from 'highcharts';
import { HcChart } from '../../../../shared/components/ops-widgets/hc-chart/hc-chart';
import { PoliceStore } from '../../../../shared/services/police-store';

/** الأحداث الأمنية حسب الساعة (#20): 24 h columns, peak in red, runner-up in amber. */
@Component({
  selector: 'app-police-hourly-chart',
  imports: [HcChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { id: 'hourly-chart', class: 'pcard' },
  templateUrl: './hourly-chart.html',
})
export class PoliceHourlyChart {
  private readonly store = inject(PoliceStore);
  protected readonly hourly = computed(() => this.store.range().hourly);

  protected readonly options = computed<Highcharts.Options>(() => {
    const buckets = this.store.timeline();
    const sorted = buckets.map((b) => b.count).sort((a, b) => b - a);
    const [first, second] = [sorted[0], sorted[1]];
    const color = (v: number, i: number) => (v === first && v > 0 ? '#f43f5e' : v === second && v > 0 ? '#f59e0b' : i % 3 === 0 ? '#5b8def' : '#a9c4f8');
    return {
      chart: { type: 'column', spacing: [4, 0, 0, 0] },
      legend: { enabled: false },
      tooltip: { headerFormat: '', pointFormat: '{point.category}: <b>{point.y}</b> حدث', shared: false },
      xAxis: { categories: buckets.map((b) => b.label), tickInterval: Math.ceil(buckets.length / 8), labels: { style: { fontSize: '11px', color: '#8a99af' } } },
      yAxis: { visible: false, min: 0 },
      plotOptions: { column: { borderRadius: 3, borderWidth: 0, pointPadding: 0.05, groupPadding: 0.04 } },
      series: [{ type: 'column', name: 'الأحداث', data: buckets.map((b, i) => ({ y: b.count, color: color(b.count, i) })) }],
    };
  });
}
