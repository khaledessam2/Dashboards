import { LastUpdated } from '../../shared/components/last-updated/last-updated';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { KpiCard, KpiDef } from '../../shared/components/kpi-card/kpi-card';
import { PoliceStore } from '../../shared/services/police-store';
import { PoliceCompareGauge } from './components/compare-gauge/compare-gauge';
import { PoliceHourlyChart } from './components/hourly-chart/hourly-chart';
import { PoliceTopZones } from './components/top-zones/top-zones';
import { PoliceCamMap } from './components/cam-map/cam-map';
import { PoliceLiveEvents } from './components/live-events/live-events';
import { PoliceCamRanking } from './components/cam-ranking/cam-ranking';

@Component({
  selector: 'app-police-dashboard',
  imports: [LastUpdated, KpiCard, PoliceCompareGauge, PoliceHourlyChart, PoliceTopZones, PoliceCamMap, PoliceLiveEvents, PoliceCamRanking],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'box-border flex flex-col gap-4 px-6 pt-4 pb-8 max-[900px]:p-4 max-[480px]:gap-3 max-[480px]:p-3' },
  templateUrl: './police-dashboard.html',
})
export class PoliceDashboard {
  protected readonly store = inject(PoliceStore);
  protected readonly lastUpdate = this.store.lastUpdate;

  protected readonly kpiCards = computed<KpiDef[]>(() => {
    const k = this.store.kpis();
    const x = this.store.extra();
    const fmt = (n: number) => n.toLocaleString('en-US');
    return [
      { id: 'kpi-total', ar: 'إجمالي الأحداث الأمنية', icon: 'shield', value: fmt(k.total) },
      { id: 'kpi-restricted', ar: 'اختراق مناطق محظورة', icon: 'block', value: fmt(k.restricted), status: 'crit' },
      { id: 'kpi-leftobj', ar: 'أجسام متروكة مشبوهة', icon: 'inventory_2', value: fmt(k.leftobj), status: 'crit' },
      { id: 'kpi-overcrowd50', ar: 'إزدحام حرج (+50)', icon: 'groups', value: fmt(k.overcrowd50), status: 'crit' },
      { id: 'kpi-overcrowd30', ar: 'إزدحام تحذيري (+30)', icon: 'diversity_3', value: fmt(k.overcrowd30), status: 'warn' },
      { id: 'kpi-tripfall', ar: 'سقوط وتعثّر', icon: 'personal_injury', value: fmt(k.tripfall), status: 'crit' },
      { id: 'kpi-loitering', ar: 'مكوث قرب المداخل', icon: 'hourglass_top', value: fmt(x.loitering), status: 'warn' },
      { id: 'kpi-intrusion', ar: 'اقتحام خارج أوقات العمل', icon: 'door_open', value: fmt(x.intrusion), status: 'crit' },
      { id: 'kpi-queue', ar: 'طابور تجاوز الحد', icon: 'queue', value: fmt(x.queue), status: 'warn' },
      { id: 'kpi-stationary', ar: 'ازدحام ثابت', icon: 'transfer_within_a_station', value: fmt(x.stationary), status: 'warn' },
      { id: 'kpi-smoke', ar: `تنبيهات الدخان · آخر موقع: ${this.store.smokeLocation()}`, icon: 'detector_smoke', value: fmt(x.smoke), status: 'crit' },
    ];
  });
}
