import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ExecutiveStore } from '../../../../shared/services/executive-store';

@Component({
  selector: 'app-exec-bottom-strip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-4', 'aria-label': 'جاهزية الساعات القادمة ومتابعة التوجيهات' },
  templateUrl: './exec-bottom-strip.html',
})
export class ExecBottomStrip {
  protected readonly store = inject(ExecutiveStore);
}
