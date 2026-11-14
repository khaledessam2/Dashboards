import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatacenterStore } from '../../../../shared/services/datacenter-store';

/** KPI-Documentation §4.6 — top 3 worst devices for ping, CPU and temperature. */
@Component({
  selector: 'app-dc-device-health',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { id: 'device-health', class: 'card' },
  templateUrl: './dc-device-health.html',
})
export class DcDeviceHealth {
  protected readonly categories = inject(DatacenterStore).deviceHealth;
}
