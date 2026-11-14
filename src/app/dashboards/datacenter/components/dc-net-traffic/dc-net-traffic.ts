import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatacenterStore } from '../../../../shared/services/datacenter-store';

/** KPI-Documentation §4.5 — top 8 network interfaces, ranked bars. */
@Component({
  selector: 'app-dc-net-traffic',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { id: 'net-load-feed', class: 'card' },
  templateUrl: './dc-net-traffic.html',
})
export class DcNetTraffic {
  private readonly load = inject(DatacenterStore).netLoad;
  protected readonly rows = computed(() => {
    const max = Math.max(1, ...this.load().map((r) => r.value));
    return this.load().map((r) => ({ ...r, width: (r.value / max) * 100 }));
  });
}
