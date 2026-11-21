import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TrafficStore } from '../../../../shared/services/traffic-store';

@Component({
  selector: 'app-exec-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './exec-header.html',
})
export class ExecHeader {
  private readonly live = inject(TrafficStore);

  protected readonly clock = computed(() => new Date(this.live.now()).toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Asia/Riyadh' }));
  protected readonly prayer = computed(() => {
    const p = this.live.nextPrayer();
    const minutes = Number(p.countdown.slice(0, 2)) * 60 + Number(p.countdown.slice(3, 5));
    return { ...p, ratio: Math.max(0, Math.min(1, minutes / 60)) };
  });
  protected readonly prayerDash = computed(() => (56.5 * (1 - this.prayer().ratio)).toFixed(1));

  protected fullscreen(): void {
    void document.documentElement.requestFullscreen?.();
  }
}
