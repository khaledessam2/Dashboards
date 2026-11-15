import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { formatTime12 } from '../../utils/time.utils';
const format = () => formatTime12(Date.now());


/** Live header clock (device local time, 12-hour), ticks every second. */
@Component({
  selector: 'app-clock',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'num text-2xl font-semibold text-ink-2 [direction:ltr] max-[900px]:text-lg' },
  template: '{{ time() }}',
})
export class Clock {
  protected readonly time = signal(format());

  constructor() {
    const id = setInterval(() => this.time.set(format()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }
}
