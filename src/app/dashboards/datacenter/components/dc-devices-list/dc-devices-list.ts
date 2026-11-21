import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FlashOnChange } from '../../../../shared/directives/flash-on-change';
import { STATUS_META } from '../../../../shared/constants/datacenter.constants';
import { DatacenterStore } from '../../../../shared/services/datacenter-store';

/** KPI-Documentation §4.9 — devices grid (max 40, 2 columns), worst first. */
@Component({
  selector: 'app-dc-devices-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [FlashOnChange],
  host: { id: 'device-feed', class: 'card' },
  templateUrl: './dc-devices-list.html',
})
export class DcDevicesList {
  protected readonly devices = inject(DatacenterStore).deviceList;
  protected readonly meta = STATUS_META;

  protected readonly tabs = [
    { key: 'all', ar: 'الكل' },
    { key: 'down', ar: 'متوقف' },
    { key: 'warning', ar: 'تحذير' },
  ] as const;
  protected readonly filter = signal<'all' | 'down' | 'warning'>('all');
  protected readonly filtered = computed(() => {
    const f = this.filter();
    return f === 'all' ? this.devices() : this.devices().filter((d) => d.status === f);
  });

  constructor() {
    inject(FlashOnChange).watch(this.devices);
  }
}
