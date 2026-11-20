import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FlashOnChange } from '../../../../shared/directives/flash-on-change';
import { MunicipalityStore } from '../../../../shared/services/municipality-store';

@Component({
  selector: 'app-muni-energy-zone',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [FlashOnChange],
  host: { id: 'chart-energy-zone', class: 'card flex flex-col' },
  templateUrl: './muni-energy-zone.html',
})
export class MuniEnergyZone {
  private readonly store = inject(MunicipalityStore);

  constructor() {
    inject(FlashOnChange).watch(this.bars);
  }

  protected readonly bars = computed(() => {
    const rows = this.store.energyByZone();
    const max = Math.max(1, ...rows.map((r) => r.value));
    return rows.map((r) => ({ ar: r.ar, value: r.value.toLocaleString('en-US'), pct: (r.value / max) * 100 }));
  });
}
