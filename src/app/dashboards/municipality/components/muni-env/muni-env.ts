import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FlashOnChange } from '../../../../shared/directives/flash-on-change';
import { MunicipalityStore } from '../../../../shared/services/municipality-store';

@Component({
  selector: 'app-muni-env',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [FlashOnChange],
  host: { id: 'env-panel', class: 'card' },
  templateUrl: './muni-env.html',
})
export class MuniEnv {
  private readonly store = inject(MunicipalityStore);

  constructor() {
    inject(FlashOnChange).watch(this.items);
  }

  protected readonly items = computed(() => {
    const e = this.store.env();
    const q = (v: number, ok: number, mid: number) =>
      v <= ok ? { ar: 'جيد', color: '#00a651' } : v <= mid ? { ar: 'مقبول', color: '#f5a623' } : { ar: 'مرتفع', color: '#e74c3c' };
    return [
      { id: 'env-temp', ar: 'درجة الحرارة', value: `${e.temp}°C`, tag: null },
      { id: 'env-hum', ar: 'الرطوبة', value: `${e.humidity}%`, tag: null },
      { id: 'env-noise', ar: 'الضوضاء', value: `${e.noise} dB`, tag: q(e.noise, 55, 70) },
      { id: 'env-pm10', ar: 'PM10', value: `${e.pm10} µg/m³`, tag: q(e.pm10, 50, 150) },
      { id: 'env-pm25', ar: 'PM2.5', value: `${e.pm25} µg/m³`, tag: q(e.pm25, 35, 75) },
    ];
  });
}
