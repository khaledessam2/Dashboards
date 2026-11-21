import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ExecutiveStore } from '../../../shared/services/executive-store';
import { ExecDrawer } from '../components/exec-drawer/exec-drawer';
import { ExecHeader } from '../components/exec-header/exec-header';
import { ExecKpis } from '../components/exec-kpis/exec-kpis';
import { ExecMap } from '../components/exec-map/exec-map';
import { ExecSituations } from '../components/exec-situations/exec-situations';

@Component({
  selector: 'app-executive-dashboard',
  imports: [ExecHeader, ExecKpis, ExecMap, ExecSituations, ExecDrawer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-h-full bg-[#f6f8fb] [font-family:IBM_Plex_Sans_Arabic,Cairo,sans-serif]' },
  templateUrl: './executive-dashboard.html',
})
export class ExecutiveDashboard {
  protected readonly store = inject(ExecutiveStore);
}
