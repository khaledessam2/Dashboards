import { LastUpdated } from '../../shared/components/last-updated/last-updated';
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
  imports: [LastUpdated, KpiCard, FlowGauge, HourlyChart, TopZones, CamRanking, CamMap, LiveEvents],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'box-border flex flex-col gap-4 px-6 pt-4 pb-8 max-[900px]:p-4 max-[480px]:gap-3 max-[480px]:p-3' },
  templateUrl: './traffic-dashboard.html',
})
export class TrafficDashboard {
  private readonly store = inject(TrafficStore);
  protected readonly lastUpdate = this.store.lastUpdate;
  private readonly kpis = this.store.kpis;

  protected readonly kpiCards = computed<KpiDef[]>(() => {
    const k = this.kpis();
    const s = this.store;
    const peak = s.hourly().reduce((best, h) => (h.count > best.count ? h : best), { label: '--', count: 0 });
    const v = s.vehicles();
    const total = s.vehicleTotal();
    const pct = (n: number) => Math.round((n / total) * 100);    const fmt = (n: number) => n.toLocaleString('en-US'); // improve number display
    return [
      { id: 'kpi-total', ar: 'إجمالي الأحداث', icon: 'monitoring', value: fmt(k.total) },
      { id: 'kpi-crosswalk', ar: 'مخالفة عبور المشاة', icon: 'directions_walk', value: fmt(k.crosswalk), status: 'crit' },
      { id: 'kpi-wrongway', ar: 'عكس الاتجاه', icon: 'swap_vert', value: fmt(k.wrongway), status: 'crit' },
      { id: 'kpi-parking', ar: 'وقوف مخالف', icon: 'local_parking', value: fmt(k.parking), status: 'warn' },
      { id: 'kpi-taxi', ar: 'تاكسي غير نظامي', icon: 'local_taxi', value: fmt(k.taxi), status: 'warn' },
      { id: 'kpi-congestion', ar: 'ازدحام مروري', icon: 'traffic', value: fmt(k.congestion), status: 'warn' },
      { id: 'kpi-peak-hour', ar: 'ساعة ذروة المخالفات', icon: 'schedule', value: peak.count ? peak.label : '--', status: 'warn' },
      { id: 'kpi-vehicles', ar: 'إجمالي المركبات', icon: 'directions_car', value: fmt(total) },
      { id: 'kpi-vehicle-class', ar: 'تصنيف المركبات', icon: 'local_shipping', value: '', parts: [
        { label: 'سيارات', value: `${pct(v.car)}%` },
        { label: 'شاحنات', value: `${pct(v.truck)}%` },
        { label: 'حافلات', value: `${pct(v.bus)}%` },
      ] },    ];
  });
}
