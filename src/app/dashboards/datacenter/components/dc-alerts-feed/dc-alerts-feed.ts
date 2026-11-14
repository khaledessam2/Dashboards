import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ALERT_META } from '../../../../shared/constants/datacenter.constants';
import { DatacenterStore } from '../../../../shared/services/datacenter-store';

const pad = (n: number) => String(n).padStart(2, '0');
const formatTime = (ms: number) => {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/** KPI-Documentation §4.8 — live alerts feed (12 items, refreshed every 15 s) + PRTG status. */
@Component({
  selector: 'app-dc-alerts-feed',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { id: 'alert-feed', class: 'card' },
  templateUrl: './dc-alerts-feed.html',
})
export class DcAlertsFeed {
  private readonly store = inject(DatacenterStore);
  protected readonly online = this.store.prtgOnline;

  protected readonly tabs = [
    { key: 'all', ar: 'الكل' },
    { key: 'critical', ar: 'حرج' },
    { key: 'warning', ar: 'تحذير' },
  ] as const;
  protected readonly filter = signal<'all' | 'critical' | 'warning'>('all');
  protected readonly filtered = computed(() => {
    const f = this.filter();
    return f === 'all' ? this.items() : this.items().filter((a) => a.severity === f);
  });

  protected readonly items = computed(() => {
    const fresh = this.store.freshAlertIds();
    return this.store.alerts().map((a) => ({ ...ALERT_META[a.severity], id: a.id, severity: a.severity, device: a.device, text: a.text, time: formatTime(a.time), fresh: fresh.has(a.id) }));
  });
}
