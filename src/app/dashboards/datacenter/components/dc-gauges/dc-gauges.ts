import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatacenterStore } from '../../../../shared/services/datacenter-store';

/** KPI-Documentation §4.1 — 4 circular gauges: CPU, RAM, Storage, Network. */
@Component({
  selector: 'app-dc-gauges',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid grid-cols-[repeat(4,minmax(0,1fr))] gap-4 max-[1100px]:grid-cols-[repeat(2,minmax(0,1fr))] max-[480px]:grid-cols-[minmax(0,1fr)] max-[480px]:gap-3' },
  templateUrl: './dc-gauges.html',
})
export class DcGauges {
  protected readonly gauges = inject(DatacenterStore).gauges;
}
