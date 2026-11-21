import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { PoliceStore } from '../../../../shared/services/police-store';
import { LEVEL_HEX, Level, TEXT } from '../ops-ui';

@Component({
  selector: 'app-police-zone-occupancy',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'pcard' },
  templateUrl: './zone-occupancy.html',
})
export class PoliceZoneOccupancy {
  private readonly store = inject(PoliceStore);
  protected readonly text = TEXT;
  protected readonly hex = LEVEL_HEX;

  protected readonly occRows = computed(() => {
    const z = this.store.zoneRows();
    const get = (id: string) => z.find((r) => r.id === id)!;
    const rows = [
      { name: 'الروضة الشريفة وممر السلام', density: get('rawdah').density, dwell: get('rawdah').dwellMin, maxD: 6 },
      { name: 'التوسعة السعودية والحرم المدني القديم', density: get('main').density, dwell: get('main').dwellMin, maxD: 5 },
      { name: 'مصليات النساء (الشرقية والغربية)', density: +((get('west').density + get('east').density) / 2).toFixed(1), dwell: 6, maxD: 5 },
      { name: 'الساحة الشمالية (المظلات)', density: get('north').density, dwell: get('north').dwellMin, maxD: 5 },
    ];
    return rows
      .map((r) => {
        const level: Level = r.density > 5 ? 'bad' : r.density >= 3.5 ? 'warn' : 'ok';
        return { ...r, occ: Math.min(Math.round((r.density / r.maxD) * 100), 100), level, status: level === 'bad' ? 'حالة حرجة (يتوجب نسب)' : level === 'warn' ? 'تحذيري' : 'طبيعي' };
      })
      .sort((a, b) => b.density - a.density);
  });
}
