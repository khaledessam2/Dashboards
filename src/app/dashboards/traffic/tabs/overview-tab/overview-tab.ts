import { FlashOnChange } from '../../../../shared/directives/flash-on-change';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HcChart, OpsMap, Panel, SevPill, StatTile } from '../../../../shared/components/ops-widgets/ops-widgets';
import { COMPARE_OPTIONS, Compare, PERIOD_OPTIONS, Period, TONE_HEX, TrafficOpsStore, ZONE_OPTIONS } from '../../../../shared/services/traffic-ops-store';
import { TrafficStore } from '../../../../shared/services/traffic-store';
import { barOptions, donutOptions, lineOptions } from '../../../../shared/utils/ops-charts';

/** نظرة عامة */
@Component({
  selector: 'app-overview-tab',
  imports: [FlashOnChange, StatTile, Panel, HcChart, OpsMap, SevPill],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-4' },
  templateUrl: './overview-tab.html',
})
export class OverviewTab {
  protected readonly o = inject(TrafficOpsStore);
  protected readonly s = inject(TrafficStore);
  protected readonly zones = ZONE_OPTIONS;
  protected readonly periods = PERIOD_OPTIONS;
  protected readonly compares = COMPARE_OPTIONS;
  protected readonly layers = signal(true);
  protected readonly mode = signal<'heat' | 'gis' | 'sat'>('heat');
  protected readonly mapModes = [
    { id: 'heat', ar: 'خريطة حرارية' },
    { id: 'gis', ar: 'رقمية GIS' },
    { id: 'sat', ar: 'قمر صناعي' },
  ] as const;

  protected readonly hiddenLevels = signal<string[]>([]);
  protected readonly legend = [
    { id: 'ok', ar: 'انسيابي', color: '#16a34a' },
    { id: 'warn', ar: 'متوسط', color: '#facc15' },
    { id: 'high', ar: 'كثيف', color: '#f97316' },
    { id: 'crit', ar: 'حرج / اختناق', color: '#ef4444' },
  ];
  protected toggleLevel(id: string): void {
    this.hiddenLevels.update((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]));
  }

  protected fmt = (n: number) => n.toLocaleString('en-US');
  /** Comparison chips disappear when the comparison is switched off. */
  protected chip = (t: string) => this.o.chip(t);

  protected readonly markers = [
    { x: 43.6, y: 44.4, tone: 'crit' as const, icon: 'warning', label: 'ازدحام - الدائري الأول' },
    { x: 65.7, y: 49.6, tone: 'warn' as const, icon: 'warning', label: 'حادث - طريق الملك عبدالعزيز' },
    { x: 32, y: 47.8, tone: 'brand' as const, icon: 'directions_car', label: 'دورية - حي العزيزية' },
    { x: 55.4, y: 42.6, tone: 'brand' as const, icon: 'directions_car', label: 'دورية - الدائري الأول' },
    { x: 38.3, y: 35.2, tone: 'purple' as const, icon: 'directions_car', label: 'حافلات - حي سلطانة' },
    { x: 64, y: 34.3, tone: 'purple' as const, icon: 'directions_car', label: 'حافلات - بني حارثة' },
    { x: 38.6, y: 63, tone: 'purple' as const, icon: 'directions_car', label: 'حافلات - حي الجمعة' },
  ];

  protected readonly alerts = computed(() => {
    const only = this.o.zoneId();
    const base = [
      { sev: 'high' as const, icon: 'car_crash', title: 'حادث مروري', place: 'طريق الملك عبدالعزيز - اتجاه الجنوب', when: 'منذ 12 دقيقة', zone: 'center' },
      { sev: 'high' as const, icon: 'swap_vert', title: 'عكس اتجاه مرصود', place: 'طريق الهجرة - تقاطع الدائري الثاني', when: 'منذ 6 دقائق', zone: 'uyun' },
      { sev: 'mid' as const, icon: 'local_shipping', title: 'ازدحام شديد', place: 'طريق إبراهيم الخليل', when: 'منذ 18 دقيقة', zone: 'aziziyah' },
      { sev: 'mid' as const, icon: 'engineering', title: 'إغلاق جزئي', place: 'طريق مكة - جدة (أعمال صيانة)', when: 'منذ 25 دقيقة', zone: 'quba' },
      { sev: 'mid' as const, icon: 'local_parking', title: 'وقوف مخالف متكرر', place: 'محيط المسجد النبوي - الساحة الشمالية', when: 'منذ 9 دقائق', zone: 'center' },
      { sev: 'low' as const, icon: 'rainy', title: 'تنبيه جوي', place: 'فرصة أمطار متوسطة على بعض المناطق', when: 'خلال ساعتين', zone: 'all' },
    ];
    const fresh = this.o.freshIds();
    const live = this.o.liveAdded().map((e) => ({ id: e.id, sev: e.sev, icon: e.icon, title: e.title, place: e.place, when: this.o.ago(e.ts), zone: e.zone, fresh: fresh.has(e.id) }));
    const all = [...live, ...base.map((a, i) => ({ ...a, id: -(i + 1), fresh: false }))];
    return all.filter((a) => only === 'all' || a.zone === only || a.zone === 'all');
  });

  protected readonly mix = computed(() =>
    donutOptions(
      [
        { name: 'سيارات خاصة', y: 68, color: TONE_HEX.brand },
        { name: 'حافلات', y: 14, color: TONE_HEX.ok },
        { name: 'مركبات نقل', y: 10, color: TONE_HEX.warn },
        { name: 'مركبات أجرة', y: 6, color: TONE_HEX.purple },
        { name: 'أخرى', y: 2, color: '#94a3b8' },
      ],
      'مركبة',
      '%',
    ),
  );
  protected readonly congested = computed(() => barOptions(this.o.topCongestedZones.map((z, i) => ({ ...z, value: Math.min(100, this.o.drift(z.value, i + 70, 0.03)) })), { max: 100, suffix: '%', heat: true }));

  protected readonly dayFlow = computed(() => {
    const z = this.o.zoneF();
    const labels = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
    return lineOptions(labels, [
      { name: 'اليوم الحالي', data: [22, 18, 48, 82, 60, 70, 88, 52].map((v) => Math.round(v * 1000 * z)), color: TONE_HEX.brand },
      ...(this.o.showCompare() ? [{ name: 'اليوم المماثل السابق', data: [20, 16, 40, 70, 62, 66, 78, 50].map((v) => Math.round(v * 1000 * z)), color: '#94a3b8', dashed: true }] : []),
    ]);
  });
}

// Types referenced by the template selects.
export type { Compare, Period };
