import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { TrafficStore } from '../../../../shared/services/traffic-store';

export interface MuniTab { id: string; ar: string; icon: string; color: string }

@Component({
  selector: 'app-muni-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative z-30 block', '(document:keydown.escape)': 'menuOpen.set(false)' },
  templateUrl: './muni-header.html',
})
export class MuniHeader {
  private readonly live = inject(TrafficStore);

  readonly tabs = input<readonly MuniTab[]>([]);
  readonly active = input<string>('');
  readonly selected = output<string>();
  protected readonly menuOpen = signal(false);

  protected select(id: string): void {
    this.selected.emit(id);
    this.menuOpen.set(false);
  }

  protected readonly clock = computed(() => new Date(this.live.now()).toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Asia/Riyadh' }));
  protected readonly updatedText = computed(() => {
    const mins = Math.floor((this.live.now() - this.live.lastUpdate()) / 60000);
    return mins < 1 ? 'قبل دقيقة' : `قبل ${mins} دقيقة`;
  });

  protected fullscreen(): void {
    void document.documentElement.requestFullscreen?.();
  }
}
