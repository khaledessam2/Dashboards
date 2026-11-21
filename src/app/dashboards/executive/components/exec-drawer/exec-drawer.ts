import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ExecutiveStore } from '../../../../shared/services/executive-store';

@Component({
  selector: 'app-exec-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'store.closeDrawer()' },
  templateUrl: './exec-drawer.html',
})
export class ExecDrawer {
  protected readonly store = inject(ExecutiveStore);
}
