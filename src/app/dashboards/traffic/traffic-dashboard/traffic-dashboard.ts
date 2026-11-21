import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FlashOnChange } from '../../../shared/directives/flash-on-change';
import { TrafficCommandStore } from '../../../shared/services/traffic-command-store';
import { TrafficStore } from '../../../shared/services/traffic-store';
import { CamerasView } from '../views/cameras-view/cameras-view';
import { FlowView } from '../views/flow-view/flow-view';
import { IncidentsView } from '../views/incidents-view/incidents-view';
import { OverviewView } from '../views/overview-view/overview-view';
import { ReadinessView } from '../views/readiness-view/readiness-view';
import { RoadsView } from '../views/roads-view/roads-view';
import { fmt } from '../traffic-ui';

const TABS = [
  { id: 'overview', ar: 'نظرة عامة تنفيذية', icon: 'layers', color: '#059669' },
  { id: 'traffic', ar: '١. الحركة والازدحام', icon: 'directions_car', color: '#10b981' },
  { id: 'incidents', ar: '٢. الحوادث والمخاطر', icon: 'warning', color: '#e11d48' },
  { id: 'roads', ar: '٣. الطرق والمواقف والنقل', icon: 'local_parking', color: '#f59e0b' },
  { id: 'cameras', ar: '٤. الكاميرات والرصد', icon: 'videocam', color: '#10b981' },
  { id: 'readiness', ar: '٥. الاستعداد والتخطيط', icon: 'event_available', color: '#d97706' },
] as const;

type TabId = (typeof TABS)[number]['id'];

@Component({
  selector: 'app-traffic-dashboard',
  imports: [FlashOnChange, OverviewView, FlowView, IncidentsView, RoadsView, CamerasView, ReadinessView],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-h-full bg-[#f6f8fb] [font-family:IBM_Plex_Sans_Arabic,Cairo,sans-serif]', '(document:keydown.escape)': 'closeModals()' },
  templateUrl: './traffic-dashboard.html',
})
export class TrafficDashboard {
  protected readonly store = inject(TrafficCommandStore);
  private readonly live = inject(TrafficStore);

  protected readonly tabs = TABS;
  protected readonly tab = signal<TabId>('overview');
  protected readonly fmt = fmt;

  protected readonly clock = computed(() => new Date(this.live.now()).toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Asia/Riyadh' }));
  protected readonly prayer = computed(() => {
    const p = this.live.nextPrayer();
    return p;
  });
  protected readonly updatedText = computed(() => {
    const mins = Math.floor((this.live.now() - this.live.lastUpdate()) / 60000);
    return mins < 1 ? 'قبل دقيقة' : `قبل ${mins} دقيقة`;
  });

  protected readonly spark = 'M2 26 L12 22 L22 17 L32 19 L42 11 L52 7 L58 4';

  protected readonly menuOpen = signal(false);

  protected selectTab(id: TabId): void {
    this.tab.set(id);
    this.menuOpen.set(false);
  }

  protected fullscreen(): void {
    void document.documentElement.requestFullscreen?.();
  }

  protected closeModals(): void {
    this.menuOpen.set(false);
    this.store.cameraModal.set(null);
  }
}
