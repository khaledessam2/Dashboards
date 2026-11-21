import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ExecutiveStore } from '../../../../shared/services/executive-store';

@Component({
  selector: 'app-exec-situations',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0 flex-col gap-4' },
  templateUrl: './exec-situations.html',
})
export class ExecSituations {
  protected readonly store = inject(ExecutiveStore);
}
