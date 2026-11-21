import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FlashOnChange } from '../../../../shared/directives/flash-on-change';
import { MunicipalityCommandStore } from '../../../../shared/services/municipality-command-store';

@Component({
  selector: 'app-muni-kpis',
  imports: [FlashOnChange],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './muni-kpis.html',
})
export class MuniKpis {
  protected readonly store = inject(MunicipalityCommandStore);
}
