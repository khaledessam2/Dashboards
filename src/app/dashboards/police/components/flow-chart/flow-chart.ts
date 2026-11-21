import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type Highcharts from 'highcharts';
import { HcChart } from '../../../../shared/components/ops-widgets/ops-widgets';
import { PoliceStore } from '../../../../shared/services/police-store';

@Component({
  selector: 'app-police-flow-chart',
  imports: [HcChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'pcard' },
  templateUrl: './flow-chart.html',
})
export class PoliceFlowChart {
  private readonly store = inject(PoliceStore);

  protected readonly series = [
    { id: 'inn', ar: 'دخول', color: '#10b981' },
    { id: 'out', ar: 'خروج', color: '#0b5cff' },
  ] as const;
  protected readonly hidden = signal<string[]>([]);
  protected toggle(id: string): void {
    this.hidden.update((h) => (h.includes(id) ? h.filter((x) => x !== id) : h.length < this.series.length - 1 ? [...h, id] : h));
  }

  protected readonly flowOptions = computed<Highcharts.Options>(() => {
    const s = this.store.flowSeries();
    return {
      chart: { type: 'areaspline', spacing: [10, 12, 0, 6] },
      legend: { enabled: false },
      tooltip: { shared: true, valueSuffix: ' شخص' },
      xAxis: { categories: s.map((p) => p.label), tickInterval: 2, labels: { style: { fontSize: '12px', fontWeight: '500', color: '#475569' } } },
      yAxis: { visible: false, min: 8000 },
      plotOptions: { areaspline: { lineWidth: 2.4, marker: { enabled: false } } },
      series: [
        { type: 'areaspline', name: 'دخول', color: '#10b981', fillOpacity: 0.1, visible: !this.hidden().includes('inn'), data: s.map((p) => p.inn) },
        { type: 'areaspline', name: 'خروج', color: '#0b5cff', fillOpacity: 0.04, visible: !this.hidden().includes('out'), data: s.map((p) => p.out) },
      ],
    };
  });
}
