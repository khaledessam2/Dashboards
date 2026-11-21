import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FlashOnChange } from '../../../../shared/directives/flash-on-change';
import { PoliceStore } from '../../../../shared/services/police-store';
import { LEVEL_HEX, fmt } from '../ops-ui';

@Component({
  selector: 'app-police-kpis',
  imports: [FlashOnChange],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './kpis.html',
})
export class PoliceKpis {
  protected readonly store = inject(PoliceStore);
  protected readonly fmt = fmt;

  protected readonly occColor = computed(() => (this.store.occupancyPct() >= 95 ? LEVEL_HEX.bad : this.store.occupancyPct() >= 85 ? LEVEL_HEX.warn : LEVEL_HEX.ok));

  protected readonly spark = computed(() => {
    const pts = this.store.spark();
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const step = 120 / Math.max(pts.length - 1, 1);
    return pts.map((v, i) => `${i ? 'L' : 'M'}${(i * step).toFixed(1)} ${(26 - ((v - min) / Math.max(max - min, 1)) * 22).toFixed(1)}`).join(' ');
  });
}
