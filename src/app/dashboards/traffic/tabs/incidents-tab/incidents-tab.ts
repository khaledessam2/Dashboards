import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HcChart, OpsMap, Panel, SevPill, StatTile } from '../../../../shared/components/ops-widgets/ops-widgets';
import { PERIOD_OPTIONS, TONE_HEX, TrafficOpsStore, ZONE_OPTIONS } from '../../../../shared/services/traffic-ops-store';
import { barOptions, columnOptions, donutOptions, lineOptions } from '../../../../shared/utils/ops-charts';

const EVENTS = [
  { sev: 'high' as const, icon: 'car_crash', title: 'حادث مروري', place: 'طريق الملك عبدالعزيز - اتجاه الجنوب', when: 'منذ 12 دقيقة', type: 'حادث', status: 'مفتوح' },
  { sev: 'high' as const, icon: 'swap_vert', title: 'عكس اتجاه مرصود', place: 'طريق الهجرة - تقاطع الدائري الثاني', when: 'منذ 6 دقائق', type: 'عكس اتجاه', status: 'مفتوح' },
  { sev: 'mid' as const, icon: 'traffic', title: 'ازدحام شديد', place: 'طريق إبراهيم الخليل', when: 'منذ 18 دقيقة', type: 'ازدحام', status: 'مفتوح' },
  { sev: 'mid' as const, icon: 'build', title: 'أعمال صيانة طارئة', place: 'طريق مكة - جدة', when: 'منذ 25 دقيقة', type: 'أعمال طرق', status: 'مفتوح' },
  { sev: 'mid' as const, icon: 'local_parking', title: 'وقوف مخالف متكرر', place: 'محيط المسجد النبوي - الساحة الشمالية', when: 'منذ 9 دقائق', type: 'وقوف مخالف', status: 'مفتوح' },
  { sev: 'mid' as const, icon: 'car_repair', title: 'تعطل مركبة', place: 'طريق المطار - اتجاه المدينة', when: 'منذ 14 دقيقة', type: 'حادث', status: 'مفتوح' },
  { sev: 'low' as const, icon: 'block', title: 'إغلاق جزئي', place: 'نفق المسفلة - مسار واحد', when: 'منذ 30 دقيقة', type: 'إغلاق', status: 'مفتوح' },
];

/** الحوادث والعمليات */
@Component({
  selector: 'app-incidents-tab',
  imports: [StatTile, Panel, HcChart, OpsMap, SevPill],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-4' },
  templateUrl: './incidents-tab.html',
})
export class IncidentsTab {
  protected readonly o = inject(TrafficOpsStore);
  protected readonly zones = ZONE_OPTIONS;
  protected readonly periods = PERIOD_OPTIONS;
  protected readonly status = signal('');
  protected readonly type = signal('');
  protected readonly types = ['حادث', 'ازدحام', 'أعمال طرق', 'إغلاق', 'عكس اتجاه', 'وقوف مخالف'];
  protected readonly markers = this.o.mapIncidents;
  protected readonly hiddenLevels = signal<string[]>([]);
  protected readonly legend = [
    { id: 'ok', ar: 'حركة سالكة', color: '#16a34a' },
    { id: 'warn', ar: 'كثافة متوسطة', color: '#f5a623' },
    { id: 'crit', ar: 'توقف / اختناق', color: '#ef4444' },
  ];
  protected toggleLevel(id: string): void {
    this.hiddenLevels.update((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]));
  }
  protected chip = (t: string) => this.o.chip(t);

  protected readonly events = computed(() => {
    const fresh = this.o.freshIds();
    const zone = this.o.zoneId();
    const live = this.o.liveAdded().filter((e) => zone === 'all' || e.zone === zone || e.zone === 'all').map((e) => ({ id: e.id, sev: e.sev, icon: e.icon, title: e.title, place: e.place, when: this.o.ago(e.ts), type: e.type, status: e.status, fresh: fresh.has(e.id) }));
    const base = EVENTS.map((e, i) => ({ ...e, id: -(i + 1), fresh: false }));
    return [...live, ...base].filter((e) => (!this.status() || e.status === this.status()) && (!this.type() || e.type === this.type()));
  });

  protected readonly reports = computed(() => donutOptions(this.o.reportStatus(), 'بلاغ'));
  protected readonly reportRows = computed(() => {
    const rows = this.o.reportStatus();
    const total = rows.reduce((s, r) => s + r.y, 0) || 1;
    return rows.map((r) => ({ ...r, pct: Math.round((r.y / total) * 100) }));
  });
  protected readonly perf = lineOptions(
    this.o.opsPerf.labels,
    [
      { name: 'زمن الاستجابة', data: this.o.opsPerf.response, color: TONE_HEX.brand },
      { name: 'زمن الإخلاء', data: this.o.opsPerf.clear, color: TONE_HEX.purple },
    ],
    { area: false },
  );
  protected readonly hourly = computed(() =>
    columnOptions(this.o.eventsByHour.labels, [
      { name: 'اليوم الحالي', data: this.o.eventsByHour.today, color: TONE_HEX.brand },
      ...(this.o.showCompare() ? [{ name: 'اليوم المماثل سابقاً', data: this.o.eventsByHour.prev, color: '#cbd5e1' }] : []),
    ]),
  );
  protected readonly eventTypes = computed(() => donutOptions(this.o.eventTypes(), 'حدث'));
  protected readonly hotspots = computed(() => barOptions(this.o.hotspots.map((h, i) => ({ ...h, value: Math.max(1, Math.round(this.o.drift(h.value, i + 80, 0.12))) })), { suffix: ' حوادث', color: TONE_HEX.crit }));
}
