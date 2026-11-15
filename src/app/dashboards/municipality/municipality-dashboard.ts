import { LastUpdated } from '../../shared/components/last-updated/last-updated';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { KpiCard, KpiDef } from '../../shared/components/kpi-card/kpi-card';
import { MunicipalityStore } from '../../shared/services/municipality-store';
import { ALERT_KEYS, ALERT_META, MODE_KEYS, MODE_META, STATUS_META } from '../../shared/models/municipality.model';
import { MuniLampsView } from './components/lamps-view/lamps-view';
import { MuniVisuiteIndicators } from './components/visuite-indicators/visuite-indicators';

const MODE_COLOR = '#00bcd4';

@Component({
  selector: 'app-municipality-dashboard',
  imports: [LastUpdated, KpiCard, MuniLampsView, MuniVisuiteIndicators],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'box-border flex flex-col gap-4 px-6 pt-4 pb-8 max-[900px]:p-4 max-[480px]:gap-3 max-[480px]:p-3' },
  templateUrl: './municipality-dashboard.html',
})
export class MunicipalityDashboard {
  private readonly store = inject(MunicipalityStore);
  protected readonly lastUpdate = this.store.lastUpdate;

  protected readonly kpiCards = computed<KpiDef[]>(() => {
    const s = this.store.statusCounts();
    const fmt = (n: number) => n.toLocaleString('en-US');
    const c = this.store.kpiChange();
    return [
      { id: 'kpi-lamps', ar: 'إجمالي الوحدات', icon: 'lightbulb', value: fmt(s.total) },
      { id: 'kpi-faults', ar: 'وحدات بها أعطال', icon: 'build', value: fmt(s.faults), status: 'crit', change: { pct: c.faults, upIsBad: true } },
      { id: 'kpi-energy', ar: 'استهلاك الطاقة (kWh)', icon: 'bolt', value: fmt(this.store.energyKwh()), change: { pct: c.energy, upIsBad: true } },
      { id: 'kpi-savings', ar: 'التوفير مقابل خط الأساس', icon: 'energy_savings_leaf', value: `${this.store.savingsPct()}%`, change: { pct: c.savings } },
    ];
  });

  protected readonly statuses = computed(() => {
    const s = this.store.statusCounts();
    return [
      { id: 'st-on', ar: 'تعمل', icon: 'lightbulb', color: STATUS_META.on.color, value: s.on },
      { id: 'st-off', ar: 'مطفأة', icon: 'light_off', color: STATUS_META.off.color, value: s.off },
      { id: 'st-nodata', ar: 'بدون بيانات', icon: 'wifi_off', color: STATUS_META.nodata.color, value: s.nodata },
    ];
  });

  protected readonly alerts = computed(() => {
    const c = this.store.alertCounts();
    return ALERT_KEYS.map((k) => ({ id: `al-${k}`, ar: ALERT_META[k].ar, color: ALERT_META[k].color, value: c[k] }));
  });

  protected readonly modes = computed(() => {
    const c = this.store.modeCounts();
    return MODE_KEYS.map((k) => ({ id: `mode-${k}`, ar: MODE_META[k].ar, color: MODE_COLOR, value: c[k] }));
  });
}
