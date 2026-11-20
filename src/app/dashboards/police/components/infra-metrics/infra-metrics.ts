import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { PoliceStore } from '../../../../shared/services/police-store';

/** مؤشرات أداء البنية التقنية للنظام (#28–#32). */
@Component({
  selector: 'app-police-infra-metrics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'pcard' },
  templateUrl: './infra-metrics.html',
})
export class PoliceInfraMetrics {
  private readonly store = inject(PoliceStore);
  protected readonly uptime = computed(() => this.store.infra().edgeUptime);

  protected readonly tiles = computed(() => {
    const i = this.store.infra();
    const warn = (v: number) => (v >= 85 ? '#e11d48' : v >= 65 ? '#f59e0b' : '#1c2434');
    return [
      { label: 'نطاق الشبكة', value: i.bandwidthGbps.toFixed(1), unit: 'Gbps', color: '#0b5cff', sub: '' },
      { label: 'استهلاك المعالج', value: `${i.cpu}%`, unit: '', color: warn(i.cpu), sub: '' },
      { label: 'الذاكرة RAM', value: `${i.ram}%`, unit: '', color: warn(i.ram), sub: '' },
      { label: 'المساحة التخزينية', value: i.storageFreeTb.toFixed(1), unit: 'TB', color: '#0b5cff', sub: `من ${i.storageTotalTb} TB إجمالاً` },
      { label: 'مدة الاحتفاظ', value: `${i.retentionDays}`, unit: 'يوم', color: '#1c2434', sub: '' },
    ];
  });
}
