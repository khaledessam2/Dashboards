import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FlashOnChange } from '../../../../shared/directives/flash-on-change';
import { PoliceStore } from '../../../../shared/services/police-store';
import { changePercent } from '../../../../shared/utils/police.utils';

const ARC = Math.PI * 100; // half-circle length for r = 100

/** مقارنة الأحداث بالفترة السابقة (#25): % change between two equal periods. */
@Component({
  selector: 'app-police-compare-gauge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [FlashOnChange],
  host: { id: 'compare-gauge', class: 'pcard' },
  templateUrl: './compare-gauge.html',
})
export class PoliceCompareGauge {
  private readonly store = inject(PoliceStore);

  constructor() {
    inject(FlashOnChange).watch(this.current);
  }

  protected readonly current = computed(() => this.store.incident().current);
  protected readonly previous = computed(() => this.store.incident().previous);
  protected readonly pct = computed(() => Math.round(changePercent(this.current(), this.previous())));
  protected readonly down = computed(() => this.pct() <= 0);
  protected readonly color = computed(() => (this.down() ? '#10b981' : '#e11d48'));
  protected readonly text = computed(() => (this.pct() > 0 ? `+${this.pct()}%` : this.pct() < 0 ? `-${Math.abs(this.pct())}%` : '0%'));
  protected readonly label = computed(() => (this.down() ? 'انخفاض في عدد الأحداث' : 'ارتفاع في عدد الأحداث'));
  protected readonly dash = computed(() => `${Math.max(0.08, Math.min(1, Math.abs(this.pct()) / 100)) * ARC} ${ARC}`);
  protected readonly arc = ARC;
}
