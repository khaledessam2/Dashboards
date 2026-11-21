import { ChangeDetectionStrategy, Component } from '@angular/core';
import type Highcharts from 'highcharts';
import { HcChart } from '../../../../shared/components/ops-widgets/ops-widgets';
import { TEXT } from '../../traffic-ui';

@Component({
  selector: 'app-traffic-flow-view',
  imports: [HcChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './flow-view.html',
})
export class FlowView {
  protected readonly text = TEXT;

  protected readonly rows = [
    { road: 'طريق الملك فيصل (الدائري الأول - جنوب)', speed: '21 km/h', dur: '34 دقيقة', len: '4.2 km', cap: 94, tone: 'bad' as const },
    { road: 'جادة قباء (باتجاه المنطقة المركزية)', speed: '22 km/h', dur: '26 دقيقة', len: '3.1 km', cap: 91, tone: 'bad' as const },
    { road: 'طريق المطار (تقاطع الدائري الثاني)', speed: '42 km/h', dur: '15 دقيقة', len: '5.6 km', cap: 79, tone: 'warn' as const },
    { road: 'طريق السلام (مدخل الساحة الغربية)', speed: '38 km/h', dur: '18 دقيقة', len: '2.8 km', cap: 82, tone: 'warn' as const },
  ];

  protected readonly peak: Highcharts.Options = {
    chart: { type: 'spline', spacing: [10, 12, 0, 6] },
    xAxis: { categories: ['12:00', '14:00', '16:00', '18:00', '20:00', '22:00'] },
    yAxis: { min: 20000 },
    tooltip: { shared: true },
    legend: { enabled: true, rtl: true },
    plotOptions: { series: { marker: { enabled: false } } },
    series: [
      { type: 'spline', name: 'الحركة اليوم (حي)', data: [31000, 36500, 44200, 48920, null, null], color: '#e11d48', lineWidth: 3 },
      { type: 'spline', name: 'متوسط آخر 4 أسابيع', data: [29500, 34000, 40500, 45100, 46800, 33000], color: '#94a3b8', dashStyle: 'ShortDash', lineWidth: 2 },
    ],
  };
}
