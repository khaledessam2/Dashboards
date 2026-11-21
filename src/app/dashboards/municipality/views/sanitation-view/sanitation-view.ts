import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MunicipalityCommandStore } from '../../../../shared/services/municipality-command-store';

@Component({
  selector: 'app-muni-sanitation-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './sanitation-view.html',
})
export class SanitationView {
  protected readonly store = inject(MunicipalityCommandStore);
}
