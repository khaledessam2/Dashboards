import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HcChart, OpsMap, Panel, SevPill, StatTile } from '../../../../shared/components/ops-widgets/ops-widgets';
import { TONE_HEX, TrafficOpsStore, ZONE_OPTIONS } from '../../../../shared/services/traffic-ops-store';
import { barOptions, coloredColumns, lineOptions } from '../../../../shared/utils/ops-charts';

/** التنبؤ والتخطيط */
@Component({
  selector: 'app-forecast-tab',
  imports: [StatTile, Panel, HcChart, OpsMap, SevPill],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-4' },
  templateUrl: './forecast-tab.html',
})
export class ForecastTab {
  protected readonly o = inject(TrafficOpsStore);
  protected readonly r = this.o.resources;
  protected readonly zones = ZONE_OPTIONS;
  protected readonly msg = signal('');
  protected readonly modes = ['الازدحام التنبؤي', 'الحوادث المحتملة', 'مسارات النقل العام'];
  protected readonly mode = signal(this.modes[0]);
  protected readonly hiddenLevels = signal<string[]>([]);
  protected readonly legend = [
    { id: 'ok', ar: 'منخفض (0% - 40%)', color: '#16a34a' },
    { id: 'warn', ar: 'متوسط (41% - 70%)', color: '#facc15' },
    { id: 'high', ar: 'مرتفع (71% - 85%)', color: '#f97316' },
    { id: 'crit', ar: 'حرج (86% - 100%)', color: '#ef4444' },
  ];
  protected toggleLevel(id: string): void {
    this.hiddenLevels.update((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]));
  }

  protected chip = (t: string) => this.o.chip(t);

  protected readonly days = computed(() => coloredColumns(this.o.dayForecast.map((d, i) => ({ ...d, value: Math.min(100, this.o.drift(d.value, i + 50, 0.025)) })), { max: 100, suffix: '%', heat: true }));
  protected readonly next = computed(() => lineOptions(this.o.nextHours.labels, [{ name: 'الازدحام المتوقع', data: this.o.nextHours.data.map((v, i) => Math.min(100, this.o.drift(v, i + 60, 0.03))), color: TONE_HEX.brand }], { suffix: '%' }));
  protected readonly factors = barOptions(this.o.impactFactors, { max: 40, suffix: '%' });
}
