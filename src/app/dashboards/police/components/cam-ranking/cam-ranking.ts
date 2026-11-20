import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FlashOnChange } from '../../../../shared/directives/flash-on-change';
import { PoliceStore } from '../../../../shared/services/police-store';

/** أعلى الكاميرات رصداً للأحداث (#22). */
@Component({
  selector: 'app-police-cam-ranking',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [FlashOnChange],
  host: { class: 'pcard' },
  templateUrl: './cam-ranking.html',
})
export class PoliceCamRanking {
  private readonly store = inject(PoliceStore);

  constructor() {
    inject(FlashOnChange).watch(this.rows);
  }

  protected readonly rows = computed(() => {
    const list = this.store.topCameras();
    const max = list[0]?.count || 1;
    return list.map((c, i) => ({ ...c, width: Math.max(6, (c.count / max) * 100), color: i === 0 ? '#f43f5e' : i < 3 ? '#0b5cff' : '#94a3b8' }));
  });
}
