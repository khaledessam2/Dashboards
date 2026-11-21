import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DcExtraCard } from './dc-extra-card/dc-extra-card';
import { EXTRA_CARDS } from './dc-extra-cards.data';

/** Proposed additions from the command-center spec (mock data). */
@Component({
  selector: 'app-dc-extra-cards',
  imports: [DcExtraCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid grid-cols-[repeat(4,minmax(0,1fr))] items-stretch gap-4 max-[1500px]:grid-cols-[repeat(2,minmax(0,1fr))] max-[900px]:grid-cols-[minmax(0,1fr)] max-[480px]:gap-3' },
  template: `
    @for (c of cards; track c.id; let i = $index) {
      <app-dc-extra-card [id]="c.id" [def]="c" [class]="i >= cards.length - 2 ? 'min-[1501px]:col-span-2' : ''" />
    }
  `,
})
export class DcExtraCards {
  protected readonly cards = EXTRA_CARDS;
}
