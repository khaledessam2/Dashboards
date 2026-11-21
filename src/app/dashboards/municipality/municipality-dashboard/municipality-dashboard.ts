import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MuniHeader } from '../components/muni-header/muni-header';
import { MuniKpis } from '../components/muni-kpis/muni-kpis';
import { MuniModals } from '../components/muni-modals/muni-modals';
import { MuniStatusStrip } from '../components/muni-status-strip/muni-status-strip';
import { EnvironmentView } from '../views/environment-view/environment-view';
import { LightingView } from '../views/lighting-view/lighting-view';
import { OverviewView } from '../views/overview-view/overview-view';
import { ReportsView } from '../views/reports-view/reports-view';
import { RoadsView } from '../views/roads-view/roads-view';
import { SanitationView } from '../views/sanitation-view/sanitation-view';
import { VideoView } from '../views/video-view/video-view';
import { WaterView } from '../views/water-view/water-view';

const TABS = [
  { id: 'overview', ar: 'نظرة عامة تنفيذية', icon: 'layers', color: '#059669' },
  { id: 'lighting', ar: '١. الإنارة الذكية والطاقة', icon: 'lightbulb', color: '#f59e0b' },
  { id: 'reports', ar: '٢. البلاغات وأوامر العمل', icon: 'assignment', color: '#e11d48' },
  { id: 'sanitation', ar: '٣. النظافة والنفايات', icon: 'cleaning_services', color: '#10b981' },
  { id: 'water', ar: '٤. المياه وتصريف الأمطار', icon: 'water_drop', color: '#10b981' },
  { id: 'roads', ar: '٥. الطرق والأرصفة والأصول', icon: 'construction', color: '#f59e0b' },
  { id: 'video', ar: '٦. تحليل الفيديو', icon: 'videocam', color: '#10b981' },
  { id: 'environment', ar: '٧. البيئة والطقس', icon: 'eco', color: '#10b981' },
] as const;

type TabId = (typeof TABS)[number]['id'];

@Component({
  selector: 'app-municipality-dashboard',
  imports: [MuniHeader, MuniStatusStrip, MuniKpis, MuniModals, OverviewView, LightingView, ReportsView, SanitationView, WaterView, RoadsView, VideoView, EnvironmentView],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-h-full bg-[#f6f8fb] [font-family:IBM_Plex_Sans_Arabic,Cairo,sans-serif]' },
  templateUrl: './municipality-dashboard.html',
})
export class MunicipalityDashboard {
  protected readonly tabs = TABS;
  protected readonly tab = signal<TabId>('overview');
}
