import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DatacenterStore } from '../../../shared/services/datacenter-store';
import { DcTopKpis } from '../components/dc-top-kpis/dc-top-kpis';
import { DcClusterHealth } from '../components/dc-cluster-health/dc-cluster-health';
import { DcPowerCooling } from '../components/dc-power-cooling/dc-power-cooling';
import { DcDrBackup } from '../components/dc-dr-backup/dc-dr-backup';
import { DcSiteBadges } from '../components/dc-site-badges/dc-site-badges';
import { DcNetTraffic } from '../components/dc-net-traffic/dc-net-traffic';
import { DcDeviceHealth } from '../components/dc-device-health/dc-device-health';
import { DcSensorDonut } from '../components/dc-sensor-donut/dc-sensor-donut';
import { DcAlertsFeed } from '../components/dc-alerts-feed/dc-alerts-feed';
import { DcDevicesList } from '../components/dc-devices-list/dc-devices-list';
import { DcGroupHealth } from '../components/dc-group-health/dc-group-health';
import { DcOpsInsights } from '../components/dc-ops-insights/dc-ops-insights';
import { DcServiceHealth } from '../components/dc-service-health/dc-service-health';
import { DcExtraCards } from '../components/dc-extra-cards/dc-extra-cards';


@Component({
  selector: 'app-datacenter-dashboard',
  imports: [DcTopKpis, DcClusterHealth, DcPowerCooling, DcDrBackup, DcSiteBadges, DcNetTraffic, DcDeviceHealth, DcSensorDonut, DcAlertsFeed, DcDevicesList, DcGroupHealth, DcOpsInsights, DcServiceHealth, DcExtraCards],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'dc-theme block min-h-full' },
  templateUrl: './datacenter-dashboard.html',
})
export class DatacenterDashboard {
  private readonly store = inject(DatacenterStore);
  protected readonly lastUpdate = this.store.lastUpdate;
  private readonly now = signal(Date.now());

  constructor() {
    const id = setInterval(() => this.now.set(Date.now()), 30_000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }

  protected readonly dateText = computed(() => {
    const d = new Date(this.now());
    const date = new Intl.DateTimeFormat('ar-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
    const time = d.toLocaleTimeString('ar-u-nu-latn', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${date} | ${time}`;
  });

  protected readonly updatedText = computed(() => {
    const mins = Math.floor((this.now() - this.lastUpdate()) / 60000);
    return mins < 1 ? 'قبل لحظات' : `قبل ${mins} دقيقة`;
  });

  protected fullscreen(): void {
    void document.documentElement.requestFullscreen?.();
  }


}
