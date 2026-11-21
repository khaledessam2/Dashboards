import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ExecutiveStore } from '../../../../shared/services/executive-store';
import { ExecBottomStrip } from '../exec-bottom-strip/exec-bottom-strip';

@Component({
  selector: 'app-exec-situations',
  imports: [ExecBottomStrip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0 flex-col gap-4' },
  templateUrl: './exec-situations.html',
})
export class ExecSituations {
  protected readonly store = inject(ExecutiveStore);
}
