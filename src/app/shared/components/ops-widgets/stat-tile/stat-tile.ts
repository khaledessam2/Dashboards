import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { TONE_HEX, Tone } from '../../../services/traffic-ops-store';

export type ChipTone = 'ok' | 'bad' | 'warn' | 'brand';
const CHIP: Record<ChipTone, { bg: string; fg: string }> = {
  ok: { bg: 'rgba(0,166,81,0.12)', fg: '#00a651' },
  bad: { bg: 'rgba(231,76,60,0.12)', fg: '#e74c3c' },
  warn: { bg: 'rgba(245,166,35,0.16)', fg: '#d98a00' },
  brand: { bg: 'rgba(37,99,235,0.12)', fg: '#2563eb' },
};

/** KPI tile in the mockup style: icon + label on top, big value, chip / ring opposite it, optional sub-line. */
@Component({
  selector: 'app-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'card gap-2 !p-4 justify-between', '[class.kpi-flash]': 'flashing()' },
  templateUrl: './stat-tile.html',
})
export class StatTile {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly unit = input<string>('');
  readonly icon = input<string>('monitoring');
  readonly tone = input<Tone | ''>('');
  readonly chip = input<string | null>(null);
  readonly chipTone = input<ChipTone>('ok');
  readonly ring = input<number | null>(null);
  readonly bar = input<number | null>(null);
  readonly sub = input<string>('');

  /** Green inset glow for ~2 s whenever the value changes (same effect as the KPI cards). */
  protected readonly flashing = signal(false);
  private previous?: string;
  private flashTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      const v = String(this.value());
      if (this.previous !== undefined && this.previous !== v) {
        this.flashing.set(true);
        clearTimeout(this.flashTimer);
        this.flashTimer = setTimeout(() => this.flashing.set(false), 2200);
      }
      this.previous = v;
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.flashTimer));
  }

  protected readonly iconColor = computed(() => (this.tone() ? TONE_HEX[this.tone() as Tone] : '#2563eb'));
  protected readonly valueColor = computed(() => (this.tone() === 'crit' || this.tone() === 'warn' || this.tone() === 'high' ? TONE_HEX[this.tone() as Tone] : 'var(--text)'));
  protected readonly chipStyle = computed(() => CHIP[this.chipTone()]);
  protected readonly ringBg = computed(() => `conic-gradient(${this.iconColor()} ${this.ring() ?? 0}%, rgba(52,71,103,0.1) 0)`);
}
