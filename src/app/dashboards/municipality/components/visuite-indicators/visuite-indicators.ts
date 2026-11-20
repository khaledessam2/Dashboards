import { FlashOnChange } from '../../../../shared/directives/flash-on-change';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MunicipalityStore } from '../../../../shared/services/municipality-store';
import { LocationStat } from '../../../../shared/models/municipality.model';

interface IndicatorDef {
  id: string;
  ar: string;
  hint: string;
  icon: string;
  color: string;
  total: number;
  rows: { ar: string; value: number; pct: number }[];
}

function build(id: string, ar: string, hint: string, icon: string, color: string, stats: LocationStat[]): IndicatorDef {
  const max = Math.max(1, ...stats.map((s) => s.value));
  return {
    id, ar, hint, icon, color,
    total: stats.reduce((a, s) => a + s.value, 0),
    rows: stats.map((s) => ({ ...s, pct: (s.value / max) * 100 })),
  };
}

@Component({
  selector: 'app-muni-visuite-indicators',
  imports: [FlashOnChange],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  templateUrl: './visuite-indicators.html',
})
export class MuniVisuiteIndicators {
  private readonly store = inject(MunicipalityStore);

  protected readonly indicators = computed<IndicatorDef[]>(() => [
    build('ind-abandoned', 'الأجسام المتروكة في الأماكن العامة', 'أكثر المواقع تكرارًا لإرسال فرق النظافة أو التفتيش', 'inventory_2', '#e74c3c', this.store.abandoned()),
    build('ind-congestion', 'تكرار الازدحام حسب الموقع', 'الطرق والتقاطعات التي تحتاج تقييمًا ميدانيًا', 'traffic', '#f5a623', this.store.congestion()),
    build('ind-tripfall', 'مواقع السقوط والتعثّر', 'مواقع متكررة لفحص الأرصفة والممرات', 'personal_injury', '#e74c3c', this.store.tripfall()),
  ]);
}
