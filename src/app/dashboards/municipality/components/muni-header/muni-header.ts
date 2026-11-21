import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TrafficStore } from '../../../../shared/services/traffic-store';

@Component({
  selector: 'app-muni-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './muni-header.html',
})
export class MuniHeader {
  private readonly live = inject(TrafficStore);

  protected readonly clock = computed(() => new Date(this.live.now()).toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Asia/Riyadh' }));
  protected readonly updatedText = computed(() => {
    const mins = Math.floor((this.live.now() - this.live.lastUpdate()) / 60000);
    return mins < 1 ? 'قبل دقيقة' : `قبل ${mins} دقيقة`;
  });

  protected fullscreen(): void {
    void document.documentElement.requestFullscreen?.();
  }
}
