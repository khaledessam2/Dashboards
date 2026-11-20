import { DestroyRef, Directive, Signal, effect, inject, input, signal } from '@angular/core';

/**
 * Green inset glow (same as the KPI cards) for 2.2s whenever the watched value changes.
 * Template use: `<div [flashOnChange]="value">`. Component hosts: `hostDirectives: [FlashOnChange]`
 * and `inject(FlashOnChange).watch(this.someSignal)` in the constructor.
 */
@Directive({
  selector: '[flashOnChange]',
  host: { '[class.kpi-flash]': 'flashing()' },
})
export class FlashOnChange {
  readonly flashOnChange = input<unknown>();
  protected readonly flashing = signal(false);

  private source?: Signal<unknown>;
  private signature?: string;
  private timer?: ReturnType<typeof setTimeout>;

  /** Watch a signal instead of the template input (for component hosts). */
  watch(source: Signal<unknown>): void {
    this.source = source;
  }

  constructor() {
    effect(() => {
      const sig = JSON.stringify(this.source ? this.source() : this.flashOnChange());
      if (this.signature !== undefined && this.signature !== sig) {
        this.flashing.set(true);
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.flashing.set(false), 2200);
      }
      this.signature = sig;
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }
}
