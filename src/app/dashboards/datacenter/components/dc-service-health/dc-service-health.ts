import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatacenterStore } from '../../../../shared/services/datacenter-store';
import { SERVICE_STATUS_META } from '../../../../shared/constants/datacenter.constants';

@Component({
  selector: 'app-dc-service-health',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'card' },
  templateUrl: './dc-service-health.html',
})
export class DcServiceHealth {
  private readonly store = inject(DatacenterStore);

  protected readonly meta = SERVICE_STATUS_META;
  protected readonly checks = this.store.serviceChecks;

  protected readonly summary = computed(() => {
    const list = this.checks();
    const count = (s: 'healthy' | 'degraded' | 'down') => list.filter((c) => c.status === s).length;
    return { healthy: count('healthy'), degraded: count('degraded'), down: count('down') };
  });

  protected age(verifiedAt: number): string {
    const s = Math.max(0, Math.round((this.store.now() - verifiedAt) / 1000));
    return s < 60 ? `قبل ${s} ث` : `قبل ${Math.floor(s / 60)} د`;
  }
}
