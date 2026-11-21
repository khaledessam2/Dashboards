import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ExecutiveStore } from '../../../../shared/services/executive-store';

@Component({
  selector: 'app-exec-bottom-strip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid grid-cols-[repeat(3,minmax(0,1fr))] gap-4 max-[1100px]:grid-cols-[minmax(0,1fr)]', 'aria-label': 'جاهزية الساعات القادمة ومتابعة التوجيهات' },
  templateUrl: './exec-bottom-strip.html',
})
export class ExecBottomStrip {
  protected readonly store = inject(ExecutiveStore);
}
