import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FlashOnChange } from '../../../../shared/directives/flash-on-change';
import { MunicipalityCommandStore } from '../../../../shared/services/municipality-command-store';

@Component({
  selector: 'app-muni-status-strip',
  imports: [FlashOnChange],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './muni-status-strip.html',
})
export class MuniStatusStrip {
  protected readonly store = inject(MunicipalityCommandStore);
}
