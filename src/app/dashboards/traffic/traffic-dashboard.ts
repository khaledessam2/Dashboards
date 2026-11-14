import { Clock } from '../../shared/components/clock/clock';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { KpiCard, KpiDef } from '../../shared/components/kpi-card/kpi-card';
import { FlowGauge } from './components/flow-gauge/flow-gauge';
import { HourlyChart } from './components/hourly-chart/hourly-chart';
import { TopZones } from './components/top-zones/top-zones';
import { CamRanking } from './components/cam-ranking/cam-ranking';
import { CamMap } from './components/cam-map/cam-map';
import { LiveEvents } from './components/live-events/live-events';
import { TrafficStore } from '../../shared/services/traffic-store';

@Component({
  selector: 'app-traffic-dashboard',
  imports: [Clock, KpiCard, FlowGauge, HourlyChart, TopZones, CamRanking, CamMap, LiveEvents],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'box-border flex flex-col gap-4 px-6 pt-4 pb-8 max-[900px]:p-4 max-[480px]:gap-3 max-[480px]:p-3' },
  templateUrl: './traffic-dashboard.html',
})
export class TrafficDashboard {
  private readonly kpis = inject(TrafficStore).kpis;

  protected readonly kpiCards = computed<KpiDef[]>(() => {
    const k = this.kpis();
    const fmt = (n: number) => n.toLocaleString('en-US'); // improve number display
    return [
      { id: 'kpi-total', ar: 'إجمالي الأحداث', icon: 'monitoring', value: fmt(k.total) },
      { id: 'kpi-crosswalk', ar: 'مخالفة عبور المشاة', icon: 'directions_walk', value: fmt(k.crosswalk) },
      { id: 'kpi-wrongway', ar: 'عكس الاتجاه', icon: 'swap_vert', value: fmt(k.wrongway) },
      { id: 'kpi-parking', ar: 'وقوف مخالف', icon: 'local_parking', value: fmt(k.parking) },
      { id: 'kpi-taxi', ar: 'تاكسي غير نظامي', icon: 'local_taxi', value: fmt(k.taxi) },
      { id: 'kpi-congestion', ar: 'ازدحام مروري', icon: 'traffic', value: fmt(k.congestion) },
    ];
  });
}
