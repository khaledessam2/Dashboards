import { Clock } from '../../shared/components/clock/clock';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { KpiCard, KpiDef } from '../../shared/components/kpi-card/kpi-card';
import { DatacenterStore } from '../../shared/services/datacenter-store';
import { DcGauges } from './components/dc-gauges/dc-gauges';
import { DcPowerCooling } from './components/dc-power-cooling/dc-power-cooling';
import { DcDrBackup } from './components/dc-dr-backup/dc-dr-backup';
import { DcSiteBadges } from './components/dc-site-badges/dc-site-badges';
import { DcNetTraffic } from './components/dc-net-traffic/dc-net-traffic';
import { DcDeviceHealth } from './components/dc-device-health/dc-device-health';
import { DcSensorDonut } from './components/dc-sensor-donut/dc-sensor-donut';
import { DcAlertsFeed } from './components/dc-alerts-feed/dc-alerts-feed';
import { DcDevicesList } from './components/dc-devices-list/dc-devices-list';
import { DcGroupHealth } from './components/dc-group-health/dc-group-health';


@Component({
  selector: 'app-datacenter-dashboard',
  imports: [Clock, KpiCard, DcGauges, DcPowerCooling, DcDrBackup, DcSiteBadges, DcNetTraffic, DcDeviceHealth, DcSensorDonut, DcAlertsFeed, DcDevicesList, DcGroupHealth],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'dc-theme box-border flex flex-col gap-4 px-6 pt-4 pb-8 max-[900px]:p-4 max-[480px]:gap-3 max-[480px]:p-3' },
  templateUrl: './datacenter-dashboard.html',
})
export class DatacenterDashboard {
  private readonly store = inject(DatacenterStore);


  protected readonly kpiCards = computed<KpiDef[]>(() => {
    const k = this.store.kpis();
    return [
      { id: 'kpi-systems', ar: 'أجهزة متصلة', icon: 'dns', value: k.systems.toLocaleString('en-US') },
      { id: 'kpi-sensors', ar: 'أجهزة الاستشعار', icon: 'sensors', value: k.sensors.toLocaleString('en-US') },
      { id: 'kpi-down', ar: 'متوقف عن العمل', icon: 'error', value: k.down.toLocaleString('en-US') },
      { id: 'kpi-warn', ar: 'تحذيرات', icon: 'warning', value: k.warn.toLocaleString('en-US') },
    ];
  });
}
