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

const GOVERNANCE = [
  { group: 'تحليل الفيديو', system: 'Ipsotek VISuite', owner: 'غرفة العمليات / المشروع', refresh: 'فوري (Real-time)', status: 'مفعّل ومتصل', ok: true },
  { group: 'إدارة الكاميرات', system: 'Milestone XProtect VMS', owner: 'الأمن / المشروع', refresh: 'فوري (Real-time)', status: 'مفعّل ومتصل', ok: true },
  { group: 'المرور التجاري', system: 'TomTom / HERE Traffic', owner: 'مزود خارجي (اشتراك API)', refresh: 'كل 1 دقيقة', status: 'متصل', ok: true },
  { group: 'الحوادث والطوارئ', system: 'نظام المرور / 911', owner: 'المركز الوطني للعمليات الأمنية', refresh: 'فوري عند البلاغ', status: 'متصل', ok: true },
  { group: 'المخاطر والحفريات', system: 'بلاغات 940 / نسق / بلدي', owner: 'أمانة منطقة المدينة المنورة', refresh: 'كل 5 دقائق', status: 'تكامل مرحلي', ok: false },
  { group: 'شبكات المياه', system: 'بلاغات الكسور والتسربات', owner: 'شركة المياه الوطنية (NWC)', refresh: 'عند حدوث بلاغ', status: 'متصل', ok: true },
  { group: 'الطيران والقطار', system: 'مطار الأمير محمد / قطار الحرمين', owner: 'طيبة للمطارات / سار (SAR)', refresh: 'كل 10 دقائق', status: 'متصل', ok: true },
];

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
  protected readonly governance = GOVERNANCE;
  protected readonly fmt = fmt;

  protected readonly clock = computed(() => new Date(this.live.now()).toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Asia/Riyadh' }));
  protected readonly prayer = computed(() => {
    const p = this.live.nextPrayer();
    const minutes = Number(p.countdown.slice(0, 2)) * 60 + Number(p.countdown.slice(3, 5));
    return { ...p, minutes, tag: minutes <= 45 ? `ذروة توافد T-${minutes}` : `متابعة اعتيادية T-${minutes}` };
  });
  protected readonly updatedText = computed(() => {
    const mins = Math.floor((this.live.now() - this.live.lastUpdate()) / 60000);
    return mins < 1 ? 'قبل دقيقة' : `قبل ${mins} دقيقة`;
  });

  protected readonly spark = 'M2 26 L12 22 L22 17 L32 19 L42 11 L52 7 L58 4';

  protected fullscreen(): void {
    void document.documentElement.requestFullscreen?.();
  }

  protected closeModals(): void {
    this.store.cameraModal.set(null);
    this.store.govOpen.set(false); 
  }
}
