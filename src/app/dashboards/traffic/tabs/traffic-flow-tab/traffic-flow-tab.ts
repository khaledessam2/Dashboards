import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { HcChart, OpsMap, Panel, StatTile } from '../../../../shared/components/ops-widgets/ops-widgets';
import { PERIOD_OPTIONS, TONE_HEX, TrafficOpsStore, ZONE_OPTIONS } from '../../../../shared/services/traffic-ops-store';
import { TrafficStore } from '../../../../shared/services/traffic-store';
import { barOptions, donutOptions, lineOptions } from '../../../../shared/utils/ops-charts';

/** الحركة المرورية */
@Component({
  selector: 'app-traffic-flow-tab',
  imports: [StatTile, Panel, HcChart, OpsMap],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-4' },
  templateUrl: './traffic-flow-tab.html',
})
export class TrafficFlowTab {
  protected readonly o = inject(TrafficOpsStore);
  protected readonly s = inject(TrafficStore);
  protected readonly zones = ZONE_OPTIONS;
  protected readonly periods = PERIOD_OPTIONS;
  protected readonly views = ['المحاور والتقاطعات', 'الأحياء والمناطق'];
  protected readonly view = signal(this.views[0]);

  protected readonly hiddenLevels = signal<string[]>([]);
  protected readonly alertOpen = signal(true);
  protected readonly legend = [
    { id: 'ok', ar: 'تدفق طبيعي (>55 كم/س)', color: TONE_HEX.ok },
    { id: 'warn', ar: 'كثافة متوسطة (40-55)', color: '#facc15' },
    { id: 'high', ar: 'ازدحام مرتفع (25-40)', color: TONE_HEX.high },
    { id: 'crit', ar: 'اختناق حرج (<25)', color: TONE_HEX.crit },
  ];
  protected toggleLevel(id: string): void {
    this.hiddenLevels.update((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]));
  }

  protected fmt = (n: number) => n.toLocaleString('en-US');
  protected chip = (t: string) => this.o.chip(t);

  protected readonly levels = [
    { ar: 'طبيعي وسلس', km: 420, pct: 62, color: TONE_HEX.ok },
    { ar: 'كثافة متوسطة', km: 122, pct: 18, color: TONE_HEX.warn },
    { ar: 'ازدحام مرتفع', km: 88, pct: 13, color: TONE_HEX.high },
    { ar: 'اختناق حرج', km: 48, pct: 7, color: TONE_HEX.crit },
  ];

  /** Speeds wobble on every live tick; the rows blink when they change. */
  protected readonly rows = computed(() => this.ranking.map((r, i) => ({ ...r, speed: Math.round(this.o.drift(r.speed, i + 10, 0.08)) })));
  protected readonly blink = signal(false);
  private prevSpeeds = '';
  private blinkTimer?: ReturnType<typeof setTimeout>;
  constructor() {
    effect(() => {
      const sig = this.rows().map((r) => r.speed).join(',');
      if (this.prevSpeeds && this.prevSpeeds !== sig) {
        this.blink.set(true);
        clearTimeout(this.blinkTimer);
        this.blinkTimer = setTimeout(() => this.blink.set(false), 5000);
      }
      this.prevSpeeds = sig;
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.blinkTimer));
  }

  protected readonly ranking = [
    { name: 'حي قباء (محور المسجد)', speed: 23, vehicles: 96300, tag: 'حرج', color: TONE_HEX.crit },
    { name: 'حي العيون (الدائري الثاني)', speed: 28, vehicles: 76510, tag: 'حرج', color: TONE_HEX.crit },
    { name: 'حي بني حارثة', speed: 32, vehicles: 64280, tag: 'مرتفع', color: TONE_HEX.high },
    { name: 'حي العزيزية (تقاطع السلام)', speed: 36, vehicles: 88420, tag: 'مرتفع', color: TONE_HEX.high },
    { name: 'حي سلطانة التجاري', speed: 48, vehicles: 52610, tag: 'متوسط', color: TONE_HEX.warn },
  ];

  protected readonly districts = computed(() => barOptions(this.o.neighborhoods, { color: TONE_HEX.brand }));
  protected readonly hourly = computed(() =>
    lineOptions(['21:00', '18:00', '15:00', '12:00', '09:00', '06:00', '03:00', '00:00'], [{ name: 'المركبات', data: [20, 30, 45, 60, 62, 55, 30, 12].map((v) => Math.round(v * 1000 * this.o.zoneF())), color: TONE_HEX.brand }]),
  );
  protected readonly trend = computed(() => {
    const z = this.o.zoneF();
    const labels = ['21:00', '18:00', '15:00', '12:00', '09:00', '06:00', '03:00', '00:00'];
    return lineOptions(labels, [
      { name: 'اليوم الحالي', data: [30, 14, 12, 40, 82, 60, 70, 88].map((v) => Math.round(v * 1000 * z)), color: TONE_HEX.brand },
      ...(this.o.showCompare() ? [{ name: 'الأسبوع الماضي', data: [28, 15, 11, 36, 70, 62, 66, 78].map((v) => Math.round(v * 1000 * z)), color: '#94a3b8', dashed: true }] : []),
    ]);
  });
  protected readonly fleet = donutOptions(
    [
      { name: 'سيارات خاصة', y: 68, color: TONE_HEX.brand },
      { name: 'حافلات زوار ومعتمرين', y: 14, color: TONE_HEX.ok },
      { name: 'نقل ولوجستيات', y: 10, color: TONE_HEX.warn },
      { name: 'مركبات أجرة وتطبيقات', y: 6, color: '#a5b4fc' },
      { name: 'أخرى', y: 2, color: '#94a3b8' },
    ],
    'مركبة',
    '%',
  );
}
