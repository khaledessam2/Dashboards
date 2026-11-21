import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FlashOnChange } from '../../../../shared/directives/flash-on-change';
import { PoliceStore } from '../../../../shared/services/police-store';

@Component({
  selector: 'app-police-lost-help',
  imports: [FlashOnChange],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'pcard' },
  templateUrl: './lost-help.html',
})
export class PoliceLostHelp {
  protected readonly store = inject(PoliceStore);
}
