import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TrafficStore } from '../../../shared/services/traffic-store';
import { CamerasTab } from '../tabs/cameras-tab/cameras-tab';
import { ForecastTab } from '../tabs/forecast-tab/forecast-tab';
import { IncidentsTab } from '../tabs/incidents-tab/incidents-tab';
import { OverviewTab } from '../tabs/overview-tab/overview-tab';
import { TrafficFlowTab } from '../tabs/traffic-flow-tab/traffic-flow-tab';

const TABS = [
  { id: 'overview', ar: 'نظرة عامة', icon: 'pie_chart' },
  { id: 'flow', ar: 'الحركة المرورية', icon: 'traffic' },
  { id: 'incidents', ar: 'الحوادث والعمليات', icon: 'warning' },
  { id: 'cameras', ar: 'الكاميرات الذكية', icon: 'videocam' },
  { id: 'forecast', ar: 'التنبؤ والتخطيط', icon: 'query_stats' },
] as const;

type TabId = (typeof TABS)[number]['id'];

/** إدارة المرور - المدينة المنورة: لوحة المعلومات التشغيلية والتحكم المروري الموحد. */
@Component({
  selector: 'app-traffic-dashboard',
  imports: [OverviewTab, TrafficFlowTab, IncidentsTab, CamerasTab, ForecastTab],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'box-border flex flex-col gap-4 px-6 pt-4 pb-8 max-[900px]:p-4 max-[480px]:gap-3 max-[480px]:p-3' },
  templateUrl: './traffic-dashboard.html',
})
export class TrafficDashboard {
  private readonly store = inject(TrafficStore);
  protected readonly tabs = TABS;
  protected readonly tab = signal<TabId>('overview');

  protected readonly dateText = computed(() => {
    const d = new Date(this.store.now());
    const date = new Intl.DateTimeFormat('ar-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
    const time = d.toLocaleTimeString('ar-u-nu-latn', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${date} | ${time}`;
  });

  protected readonly updatedText = computed(() => {
    const mins = Math.floor((this.store.now() - this.store.lastUpdate()) / 60000);
    return mins < 1 ? 'قبل دقيقة' : `قبل ${mins} دقيقة`;
  });

  protected fullscreen(): void {
    void document.documentElement.requestFullscreen?.();
  }
}
