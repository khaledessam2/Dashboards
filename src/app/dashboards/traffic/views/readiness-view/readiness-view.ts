import { ChangeDetectionStrategy, Component } from '@angular/core';
import type Highcharts from 'highcharts';
import { HcChart } from '../../../../shared/components/ops-widgets/ops-widgets';

@Component({
  selector: 'app-traffic-readiness-view',
  imports: [HcChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './readiness-view.html',
})
export class ReadinessView {
  protected readonly arrivals: Highcharts.Options = {
    chart: { type: 'column', spacing: [10, 12, 0, 6] },
    xAxis: { categories: ['17:00', '18:00', '19:00', '20:00', '21:00'] },
    yAxis: { min: 0 },
    legend: { enabled: true, rtl: true },
    tooltip: { shared: true, valueSuffix: ' مسافر' },
    plotOptions: { column: { stacking: 'normal', borderRadius: 3, borderWidth: 0 } },
    series: [
      { type: 'column', name: 'مطار الأمير محمد (MED)', data: [2400, 4150, 3100, 2200, 1850], color: '#059669' },
      { type: 'column', name: 'قطار الحرمين السريع', data: [1500, 2300, 1900, 1600, 1400], color: '#d97706' },
    ],
  };
}
