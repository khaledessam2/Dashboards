import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TrafficStore } from '../../../../shared/services/traffic-store';

@Component({
  selector: 'app-vehicle-mix',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { id: 'vehicle-mix', class: 'card' },
  templateUrl: './vehicle-mix.html',
})
export class VehicleMix {
  private readonly store = inject(TrafficStore);

  protected readonly items = computed(() => {
    const v = this.store.vehicles();
    const total = this.store.vehicleTotal() || 1;
    const pct = (n: number) => Math.round((n / total) * 100);
    return [
      { ar: 'سيارات', icon: 'directions_car', pct: pct(v.car), bg: 'bg-green-600/15', fg: 'text-green-600' },
      { ar: 'حافلات', icon: 'directions_bus', pct: pct(v.bus), bg: 'bg-sky-500/15', fg: 'text-sky-500' },
      { ar: 'شاحنات', icon: 'local_shipping', pct: pct(v.truck), bg: 'bg-purple-500/15', fg: 'text-purple-500' },
    ];
  });
}
