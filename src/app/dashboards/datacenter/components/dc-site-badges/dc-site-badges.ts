import { ChangeDetectionStrategy, Component } from '@angular/core';

/** KPI-Documentation §4.7 — DC site status badges (static / mock). */
@Component({
  selector: 'app-dc-site-badges',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { id: 'site-badges', class: 'card' },
  templateUrl: './dc-site-badges.html',
})
export class DcSiteBadges {
  protected readonly badges = [
    { name: 'DC-1 رئيسي', status: 'نشط', color: '#00a651' },
    { name: 'DC-2 احتياطي', status: 'نشط', color: '#00a651' },
    { name: 'DR Site', status: 'نشط', color: '#00a651' },
    { name: 'Cloud Hybrid', status: 'متصل', color: '#00bcd4' },
  ];
}
