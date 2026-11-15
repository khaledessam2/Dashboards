import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Metric {
  ar: string;
  value: string;
  icon: string;
  ok?: boolean;
}

/** KPI-Documentation §4.4 — Disaster Recovery & Backup (static / mock). */
@Component({
  selector: 'app-dc-dr-backup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { id: 'dr-backup', class: 'card' },
  templateUrl: './dc-dr-backup.html',
})
export class DcDrBackup {
  protected readonly metrics: Metric[] = [
    { ar: 'آخر نسخة احتياطية', value: '12:15 ص', icon: 'backup' },
    { ar: 'RPO المحقق', value: '< 15 د', icon: 'history', ok: true },
    { ar: 'RTO المحقق', value: '< 30 د', icon: 'timer', ok: true },
    { ar: 'DR Sync', value: 'متزامن', icon: 'sync', ok: true },
    { ar: 'اختبار DR', value: 'ناجح', icon: 'task_alt', ok: true },
    { ar: 'Replication Lag', value: '< 5 ث', icon: 'swap_horiz', ok: true },
  ];
}
