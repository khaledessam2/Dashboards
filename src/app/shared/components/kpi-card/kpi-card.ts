import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, signal } from '@angular/core';

export interface KpiDef {
  id: string;
  ar: string;
  icon: string;
  value: string;
}

@Component({
  selector: 'app-kpi-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[id]': 'def().id',
    '[class.kpi-flash]': 'flashing()',
    class: 'card justify-center',
  },
  templateUrl: './kpi-card.html',
})

export class KpiCard {
  readonly def = input.required<KpiDef>();

  /** Green inset glow for 1.2s whenever the value changes between refreshes (KPI-Documentation §7). */
  protected readonly flashing = signal(false);
  private previous: string | undefined;
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      const value = this.def().value;
      if (this.previous !== undefined && this.previous !== value) {
        this.flashing.set(true);
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.flashing.set(false), 2200);
      }
      this.previous = value;
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }
}
