import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatacenterStore } from '../../../../shared/services/datacenter-store';
import { formatDuration } from '../../../../shared/constants/datacenter.constants';

@Component({
  selector: 'app-dc-ops-insights',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid grid-cols-[repeat(3,minmax(0,1fr))] gap-4 max-[1400px]:grid-cols-[repeat(2,minmax(0,1fr))] max-[900px]:grid-cols-[minmax(0,1fr)] max-[480px]:gap-3' },
  templateUrl: './dc-ops-insights.html',
})
export class DcOpsInsights {
  private readonly store = inject(DatacenterStore);

  protected readonly fmt = formatDuration;
  protected readonly outages = this.store.openOutages;
  protected readonly stale = this.store.staleSensors;

  protected readonly period = signal<7 | 30>(7);
  protected readonly periods = [7, 30] as const;
  protected readonly failing = computed(() => {
    const key = this.period() === 7 ? 'd7' : 'd30';
    return [...this.store.failingDevices()].sort((a, b) => b[key] - a[key]).map((d) => ({ name: d.name, count: d[key] }));
  });
}
