import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';

const pad = (n: number) => String(n).padStart(2, '0');
const format = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/** Live header clock (device local time, HH:MM:SS), ticks every second. */
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
