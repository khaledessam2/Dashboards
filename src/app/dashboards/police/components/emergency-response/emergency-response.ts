import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PoliceStore } from '../../../../shared/services/police-store';
import { TINT } from '../ops-ui';

@Component({
  selector: 'app-police-emergency-response',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'pcard' },
  templateUrl: './emergency-response.html',
})
export class PoliceEmergencyResponse {
  protected readonly store = inject(PoliceStore);
  protected readonly tint = TINT;
}
