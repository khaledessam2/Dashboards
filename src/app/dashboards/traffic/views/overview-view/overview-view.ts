import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import type Highcharts from 'highcharts';
import { FlashOnChange } from '../../../../shared/directives/flash-on-change';
import { HcChart } from '../../../../shared/components/ops-widgets/ops-widgets';
import { TrafficCommandStore } from '../../../../shared/services/traffic-command-store';
import { RoadMap } from '../../components/road-map/road-map';
import { BAR, TEXT } from '../../traffic-ui';

@Component({
  selector: 'app-traffic-overview-view',
  imports: [HcChart, RoadMap, FlashOnChange],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './overview-view.html',
})
export class OverviewView {
  protected readonly store = inject(TrafficCommandStore);
  protected readonly corridors = this.store.corridors;
  protected readonly parking = this.store.parking;
  protected readonly response = this.store.response;
  protected readonly alerts = [
    { icon: 'u_turn_left', title: 'رصد عكس اتجاه', place: 'مخرج نفق المناخة الفرعي', rule: 'VISuite Rule #03', ago: 'منذ 35ث', urgent: true, cam: 'مخرج نفق المناخة - عكس اتجاه' },
    { icon: 'block', title: 'وقوف مخالف يعيق مسار حافلات', place: 'طريق الملك عبدالعزيز - مدخل المنطقة المركزية', rule: 'VISuite Rule #14', ago: 'منذ 1د', urgent: false, cam: 'طريق الملك عبدالعزيز - وقوف مخالف' },
    { icon: 'car_crash', title: 'مركبة متعطلة في المسار', place: 'طريق المطار - جسر الملك عبدالله', rule: 'VISuite Rule #09', ago: 'منذ 2د', urgent: true, cam: 'كاميرا طريق المطار - جسر الملك عبدالله' },
    { icon: 'directions_walk', title: 'عبور مشاة مخالف', place: 'تقاطع طريق سلطانة مع الدائري الثاني', rule: 'VISuite Rule #07', ago: 'منذ 3د', urgent: false, cam: 'كاميرا طريق سلطانة' },
    { icon: 'traffic', title: 'ازدحام عند مدخل الدائري الأول', place: 'جادة قباء - مدخل الدائري الأول', rule: 'VISuite Rule #21', ago: 'منذ 4د', urgent: false, cam: 'كاميرا جادة قباء - مدخل الدائري الأول' },
    { icon: 'local_taxi', title: 'سيارة أجرة غير مرخصة', place: 'محيط محطة قطار الحرمين', rule: 'VISuite Rule #18', ago: 'منذ 8د', urgent: false, cam: 'كاميرا محطة قطار الحرمين - الرصيف' },
    { icon: 'local_parking', title: 'وقوف طويل مخالف', place: 'طريق الملك فهد - قرب محطة الحافلات', rule: 'VISuite Rule #14', ago: 'منذ 11د', urgent: false, cam: 'كاميرا طريق الملك فهد - الدائري الأول' },
  ];
  protected readonly incidents = [
    { id: '#NWC-211', title: 'تسرب مياه وتجمع (شركة المياه)', place: 'طريق السلام - المسار الأيمن (تأثير متوسط)', status: 'جارٍ الإصلاح', color: '#0ea5e9' },
    { id: '#MUN-518', title: 'عطل إنارة + عائق رصيف (940)', place: 'تقاطع طريق سلطانة مع الدائري الثاني', status: 'مُسند للأمانة', color: '#f59e0b' },
    { id: '#TRF-915', title: 'مركبة متعطلة في المسار', place: 'طريق المطار - جسر الملك عبدالله', status: 'بانتظار الونش', color: '#e11d48' },
    { id: '#NWC-214', title: 'انسداد مصرف مياه أمطار', place: 'طريق الملك عبدالله - الدائري الثاني', status: 'فرقة بالموقع', color: '#0ea5e9' },
    { id: '#MUN-523', title: 'حفرة في الطريق', place: 'طريق سلطانة - مسار الخدمة', status: 'مُسند للأمانة', color: '#f59e0b' },
    { id: '#TRF-912', title: 'تصادم خفيف (دون إصابات)', place: 'طريق السلام - مدخل الساحة الغربية', status: 'تم الإخلاء', color: '#10b981' },
    { id: '#MUN-531', title: 'إشارة مرور معطلة', place: 'تقاطع الملك فهد مع الدائري الأول', status: 'بانتظار الصيانة', color: '#f59e0b' },
  ];
  protected readonly bar = BAR;
  protected readonly text = TEXT;

  protected readonly flow = computed<Highcharts.Options>(() => ({
    chart: { type: 'areaspline', spacing: [10, 12, 0, 6] },
    xAxis: { categories: ['15:00', '15:30', '16:00', '16:30', '17:00'] },
    yAxis: { min: 6000 },
    legend: { enabled: true, rtl: true },
    tooltip: { shared: true, valueSuffix: ' مركبة' },
    plotOptions: { areaspline: { lineWidth: 2.4, marker: { enabled: false } } },
    series: [
      { type: 'areaspline', name: 'مركبات داخلة', data: this.store.flowSeries(), color: '#10b981', fillOpacity: 0.1 },
      { type: 'areaspline', name: 'مركبات خارجة', data: [8900, 9600, 10400, 11100, 11440], color: '#0b5cff', fillOpacity: 0.04 },
    ],
  }));

  protected readonly classes = [
    { name: 'سيارات خاصة', y: 68, color: '#0b5cff', text: 'text-ink' },
    { name: 'حافلات وترددي', y: 24, color: '#10b981', text: 'text-[#059669]' },
    { name: 'شاحنات وخدمات', y: 8, color: '#f59e0b', text: 'text-[#d97706]' },
  ];

  protected readonly classChart: Highcharts.Options = {
    chart: { type: 'pie', spacing: [0, 0, 0, 0] },
    legend: { enabled: false },
    tooltip: { pointFormat: '<b>{point.y}%</b>', shared: false },
    plotOptions: { pie: { innerSize: '68%', borderWidth: 2, borderColor: '#ffffff', dataLabels: { enabled: false } } },
    series: [{ type: 'pie', name: 'التصنيف', data: [{ name: 'سيارات خاصة', y: 68, color: '#0b5cff' }, { name: 'حافلات وترددي', y: 24, color: '#10b981' }, { name: 'شاحنات', y: 8, color: '#f59e0b' }] }],
  };






}
