import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { PoliceStore } from '../../../../shared/services/police-store';

@Component({
  selector: 'app-police-status-strip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './status-strip.html',
})
export class PoliceStatusStrip {
  protected readonly store = inject(PoliceStore);

  protected readonly tag = computed(() => {
    const m = this.store.nextPrayer().minutes;
    return m <= 45 ? 'T-45 تأهب لحركة الحشود' : `T-${m} متابعة اعتيادية`;
  });
}
