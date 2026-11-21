import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import type Highcharts from 'highcharts';
import { HcChart } from '../../../../shared/components/ops-widgets/ops-widgets';
import { PoliceStore } from '../../../../shared/services/police-store';

@Component({
  selector: 'app-police-arrival-waves',
  imports: [HcChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'pcard' },
  templateUrl: './arrival-waves.html',
})
export class PoliceArrivalWaves {
  protected readonly store = inject(PoliceStore);

  protected readonly waveOptions = computed<Highcharts.Options>(() => {
    const rows = this.store.waves().rows;
    return {
      chart: { type: 'column', spacing: [18, 4, 0, 4] },
      legend: { enabled: false },
      tooltip: { shared: true, valueSuffix: ' وافد' },
      xAxis: { categories: rows.map((r) => r.time), labels: { style: { fontSize: '14px', fontWeight: '600', color: '#334155' } } },
      yAxis: {
        title: { text: undefined }, labels: { enabled: false }, gridLineWidth: 0,
        stackLabels: { enabled: true, style: { fontSize: '15px', fontWeight: '700', color: '#1c2434', textOutline: 'none' }, formatter() { return `${(Number(this.total) / 1000).toFixed(1)}k`; } },
      },
      plotOptions: { column: { stacking: 'normal', borderWidth: 0, borderRadius: 3, pointPadding: 0.1, groupPadding: 0.08 } },
      series: [
        { type: 'column', name: 'محطة قطار الحرمين (منتظم)', color: '#7c3aed', data: rows.map((r) => r.train) },
        { type: 'column', name: 'مطار (MED) المتوقع', color: '#0891b2', data: rows.map((r) => r.air) },
      ],
    };
  });
}
