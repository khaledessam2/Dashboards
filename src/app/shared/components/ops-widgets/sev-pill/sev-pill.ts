import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Severity pill. */
@Component({
  selector: 'app-sev',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-block rounded px-2 py-0.5 text-sm font-bold',
    '[class.bg-red-600/10]': "sev() === 'high'",
    '[class.text-sev-red]': "sev() === 'high'",
    '[class.bg-sev-amber/10]': "sev() === 'mid'",
    '[class.text-sev-amber]': "sev() === 'mid'",
    '[class.bg-brand/10]': "sev() === 'low'",
    '[class.text-brand]': "sev() === 'low'",
  },
  templateUrl: './sev-pill.html',
})
export class SevPill {
  readonly sev = input.required<'high' | 'mid' | 'low'>();
  protected readonly label = computed(() => ({ high: 'عالي', mid: 'متوسط', low: 'منخفض' })[this.sev()]);
}
