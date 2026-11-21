import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PoliceStore } from '../../../../shared/services/police-store';

@Component({
  selector: 'app-police-status-strip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './status-strip.html',
})
export class PoliceStatusStrip {
  protected readonly store = inject(PoliceStore);
}
