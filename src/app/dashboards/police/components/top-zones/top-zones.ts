import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ZoneStat } from '../../../../shared/models/police.model';
import { PoliceStore } from '../../../../shared/services/police-store';

const rank = (list: ZoneStat[], [dark, light]: [string, string]) => {
  const max = Math.max(...list.map((z) => z.value), 1);
  return list.map((z, i) => ({ ...z, width: (z.value / max) * 100, color: i < 3 ? dark : light }));
};

/** One card, two ranked lists: zones by events (#24, right) and zones by movement (#16, left). */
@Component({
  selector: 'app-police-top-zones',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'pcard' },
  templateUrl: './top-zones.html',
})
export class PoliceTopZones {
  private readonly store = inject(PoliceStore);

  protected readonly lists = computed(() => [
    { title: 'أكثر المناطق تسجيلاً للأحداث', rows: rank(this.store.zones(), ['#0b5cff', '#7aa7ff']) },
    { title: 'أكثر المناطق حركة وتدفقاً', rows: rank(this.store.moveZones(), ['#10b981', '#6ee7b7']) },
  ]);
}
