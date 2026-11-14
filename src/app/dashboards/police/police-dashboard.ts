import { Clock } from '../../shared/components/clock/clock';
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
  imports: [Clock, KpiCard, PoliceCompareGauge, PoliceHourlyChart, PoliceTopZones, PoliceCamMap, PoliceLiveEvents, PoliceCamRanking],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'box-border flex flex-col gap-4 px-6 pt-4 pb-8 max-[900px]:p-4 max-[480px]:gap-3 max-[480px]:p-3' },
  templateUrl: './police-dashboard.html',
})
export class PoliceDashboard {
  protected readonly store = inject(PoliceStore);

  protected readonly kpiCards = computed<KpiDef[]>(() => {
    const k = this.store.kpis();
    const fmt = (n: number) => n.toLocaleString('en-US');
    return [
      { id: 'kpi-total', ar: 'إجمالي الأحداث الأمنية', icon: 'shield', value: fmt(k.total) },
      { id: 'kpi-restricted', ar: 'اختراق مناطق محظورة', icon: 'block', value: fmt(k.restricted) },
      { id: 'kpi-leftobj', ar: 'أجسام متروكة مشبوهة', icon: 'inventory_2', value: fmt(k.leftobj) },
      { id: 'kpi-overcrowd50', ar: 'إزدحام حرج (+50)', icon: 'groups', value: fmt(k.overcrowd50) },
      { id: 'kpi-overcrowd30', ar: 'إزدحام تحذيري (+30)', icon: 'diversity_3', value: fmt(k.overcrowd30) },
      { id: 'kpi-tripfall', ar: 'سقوط وتعثّر', icon: 'personal_injury', value: fmt(k.tripfall) },
    ];
  });
}
