import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface DashboardLink {
  path: string | null;
  ar: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'box-border flex h-full flex-col max-[900px]:h-auto' },
  templateUrl: './sidebar.html',
})

export class Sidebar {
  DASHBOARDS: DashboardLink[] = [
    { path: '/traffic', ar: 'المرور', icon: 'directions_car' },
    { path: null, ar: 'الأمن العام', icon: 'verified_user' },
    { path: null, ar: 'مركز البيانات', icon: 'dns' },
  ];
  protected readonly dashboards = this.DASHBOARDS;
}
