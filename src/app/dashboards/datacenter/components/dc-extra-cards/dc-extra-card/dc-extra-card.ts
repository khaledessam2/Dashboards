import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { FlashOnChange } from '../../../../../shared/directives/flash-on-change';
import { ExtraCardDef, Sev } from '../dc-extra-cards.data';

const SEV_COLOR: Record<Sev, string> = {
  ok: 'var(--sev-green)',
  warn: 'var(--sev-amber)',
  crit: 'var(--sev-red)',
};

/** Generic card for the proposed additions (mock data; metrics list / bars / table). */
@Component({
  selector: 'app-dc-extra-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [FlashOnChange],
  host: { class: 'card' },
  templateUrl: './dc-extra-card.html',
})
export class DcExtraCard {
  readonly def = input.required<ExtraCardDef>();

  constructor() {
    inject(FlashOnChange).watch(this.def);
  }

  protected color(sev?: Sev): string {
    return sev ? SEV_COLOR[sev] : 'var(--text)';
  }
}
