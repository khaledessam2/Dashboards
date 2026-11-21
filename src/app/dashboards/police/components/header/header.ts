import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { PoliceStore } from '../../../../shared/services/police-store';

@Component({
  selector: 'app-police-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './header.html',
})
export class PoliceHeader {
  protected readonly store = inject(PoliceStore);

  protected readonly updatedText = computed(() => {
    const mins = Math.floor((this.store.now() - this.store.lastUpdate()) / 60000);
    return mins < 1 ? 'قبل دقيقة' : `قبل ${mins} دقيقة`;
  });

  protected readonly clock = computed(() => new Date(this.store.now()).toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Asia/Riyadh' }));

  protected fullscreen(): void {
    void document.documentElement.requestFullscreen?.();
  }

}
