import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Camera, CamerasService } from '../../../../shared/services/cameras.service';
import { PoliceStore } from '../../../../shared/services/police-store';
import { CameraPopup } from '../../../traffic/components/camera-popup/camera-popup';
import { LEVEL_HEX } from '../ops-ui';

@Component({
  selector: 'app-police-gates-table',
  imports: [CameraPopup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'pcard' },
  templateUrl: './gates-table.html',
})
export class PoliceGatesTable {
  protected readonly store = inject(PoliceStore);
  protected readonly hex = LEVEL_HEX;
  private readonly cameras = inject(CamerasService).cameras;
  protected readonly selected = signal<Camera | null>(null);

  protected open(ip: string): void {
    this.selected.set(this.cameras().find((c) => c.ip === ip) ?? null);
  }
}
