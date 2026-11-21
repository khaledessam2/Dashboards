import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MunicipalityCommandStore } from '../../../../shared/services/municipality-command-store';

@Component({
  selector: 'app-muni-water-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './water-view.html',
})
export class WaterView {
  protected readonly store = inject(MunicipalityCommandStore);
}
