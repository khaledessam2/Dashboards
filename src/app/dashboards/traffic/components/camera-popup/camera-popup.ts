import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Camera, CamerasService } from '../../../../shared/services/cameras.service';

/** Live-stream popup for a camera (same dialog as the camera map). Closes on backdrop click, ✕ or Escape. */
@Component({
  selector: 'app-camera-popup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closed.emit()' },
  templateUrl: './camera-popup.html',
})
export class CameraPopup {
  readonly camera = input.required<Camera>();
  readonly closed = output<void>();
  private readonly service = inject(CamerasService);
  protected readonly url = computed(() => this.service.streamUrl(this.camera()));
}
