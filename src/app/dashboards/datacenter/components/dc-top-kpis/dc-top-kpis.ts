import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FlashOnChange } from '../../../../shared/directives/flash-on-change';
import { DatacenterStore } from '../../../../shared/services/datacenter-store';

interface Tile {
  id: string;
  label: string;
  icon: string;
  value: string;
  unit?: string;
  color: string;
  bg: string;
  /** Progress bar (0–100). */
  bar?: number;
  sub?: string;
  chip?: { text: string; tone: 'ok' | 'bad' | 'warn' };
  alert?: boolean;
}

const CHIP = { ok: 'bg-[#ecfdf5] text-[#059669]', bad: 'bg-[#fff1f2] text-[#e11d48]', warn: 'bg-[#fffbeb] text-[#d97706]' };

/** Top row: 7 summary tiles (CPU, RAM, storage, network, availability, critical alerts, devices). */
@Component({
  selector: 'app-dc-top-kpis',
  imports: [FlashOnChange],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid grid-cols-[repeat(7,minmax(0,1fr))] gap-3 max-[1500px]:grid-cols-[repeat(4,minmax(0,1fr))] max-[1000px]:grid-cols-[repeat(2,minmax(0,1fr))] max-[480px]:grid-cols-[minmax(0,1fr)]' },
  templateUrl: './dc-top-kpis.html',
})
export class DcTopKpis {
  private readonly store = inject(DatacenterStore);
  protected readonly chipClass = CHIP;

  protected readonly tiles = computed<Tile[]>(() => {
    const k = this.store.kpis();
    const gauges = this.store.gauges().map((g): Tile => {
      const [value, unit] = g.valueText.split(' ');
      const tone = g.pct >= 85 ? 'bad' : g.pct >= 70 ? 'warn' : 'ok';
      return {
        id: g.id, label: g.ar, icon: g.icon, value, unit, color: g.color,
        bg: `color-mix(in srgb, ${g.color} 12%, white)`, bar: g.pct,
        chip: { text: tone === 'ok' ? 'طبيعي' : tone === 'warn' ? 'مرتفع' : 'حرج', tone },
      };
    });
    return [
      ...gauges,
      { id: 'kpi-availability', label: 'توافر الخدمات', icon: 'check_circle', value: '99.93%', color: '#059669', bg: '#ecfdf5', chip: { text: 'متوافق', tone: 'ok' } },
      { id: 'kpi-critical', label: 'التنبيهات الحرجة', icon: 'warning', value: k.down.toLocaleString('en-US'), color: '#e11d48', bg: '#fff1f2', sub: 'يتطلب التدخل السريع', chip: { text: '33% ↑', tone: 'bad' }, alert: true },
      { id: 'kpi-devices', label: 'الأجهزة المتصلة', icon: 'desktop_windows', value: k.systems.toLocaleString('en-US'), color: '#1c2434', bg: '#ecfdf5', sub: 'عقد خوادم وشبكات نشطة', chip: { text: '3% ↑', tone: 'ok' } },
    ];
  });
}
