import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Camera, CamerasService } from '../../../../shared/services/cameras.service';
import { PoliceStore } from '../../../../shared/services/police-store';
import { CameraPopup } from '../../../traffic/components/camera-popup/camera-popup';

@Component({
  selector: 'app-police-safety-alerts',
  imports: [CameraPopup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'pcard !p-0' },
  templateUrl: './safety-alerts.html',
})
export class PoliceSafetyAlerts {
  protected readonly store = inject(PoliceStore);
  private readonly cameras = inject(CamerasService).cameras;
  protected readonly selected = signal<Camera | null>(null);

  protected open(ip: string): void {
    this.selected.set(this.cameras().find((c) => c.ip === ip) ?? null);
  }
}
