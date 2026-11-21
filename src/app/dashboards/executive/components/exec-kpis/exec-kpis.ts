import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ExecutiveStore } from '../../../../shared/services/executive-store';

@Component({
  selector: 'app-exec-kpis',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid grid-cols-[repeat(5,minmax(0,1fr))] gap-4 max-[1500px]:grid-cols-[repeat(3,minmax(0,1fr))] max-[900px]:grid-cols-[repeat(2,minmax(0,1fr))] max-[560px]:grid-cols-[minmax(0,1fr)]', 'aria-label': 'المؤشرات القيادية الخمسة' },
  templateUrl: './exec-kpis.html',
})
export class ExecKpis {
  protected readonly store = inject(ExecutiveStore);

  protected readonly overall = signal({ pct: 92, label: 'مستقر', color: '#059669', soft: '#ecfdf5' });
  protected readonly gaugeOffset = computed(() => (251.2 * (1 - this.overall().pct / 100)).toFixed(1));
  protected readonly traffic = signal({ pct: 84, pill: 'مقطع متأثر (1)' });
}
