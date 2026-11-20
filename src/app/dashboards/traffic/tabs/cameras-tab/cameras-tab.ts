import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CamMap } from '../../components/cam-map/cam-map';
import { CameraPopup } from '../../components/camera-popup/camera-popup';
import { Camera, CamerasService } from '../../../../shared/services/cameras.service';
import { HcChart, Panel, StatTile } from '../../../../shared/components/ops-widgets/ops-widgets';
import { PERIOD_OPTIONS, TONE_HEX, TrafficOpsStore, ZONE_OPTIONS } from '../../../../shared/services/traffic-ops-store';
import { TrafficStore } from '../../../../shared/services/traffic-store';
import { barOptions, donutOptions, lineOptions } from '../../../../shared/utils/ops-charts';

/** الكاميرات الذكية */
@Component({
  selector: 'app-cameras-tab',
  imports: [StatTile, Panel, HcChart, CamMap, CameraPopup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-4' },
  templateUrl: './cameras-tab.html',
})
export class CamerasTab {
  protected readonly o = inject(TrafficOpsStore);
  protected readonly zones = ZONE_OPTIONS;
  protected readonly periods = PERIOD_OPTIONS;
  protected readonly msg = signal('');
  protected readonly filter = signal<'all' | 'on' | 'alert'>('all');
  protected readonly selected = signal<Camera | null>(null);
  private readonly camerasService = inject(CamerasService);
  /** Cameras that just raised an event → their live tile blinks. */
  protected readonly freshCams = inject(TrafficStore).freshCameraIds;
  protected readonly liveCams = computed(() => this.camerasService.cameras().filter((c) => c.online));

  protected fmt = (n: number) => n.toLocaleString('en-US');
  protected chip = (t: string) => this.o.chip(t);

  protected readonly c = computed(() => {
    const z = Math.max(this.o.zoneF(), 0.1);
    const total = Math.round(700 * z);
    const offline = Math.max(1, Math.round(28 * z));
    return { total, offline, online: total - offline, pct: Math.round(((total - offline) / total) * 100) };
  });
  protected readonly chips = computed(() => [
    { id: 'all' as const, ar: 'الكل', dot: '' },
    { id: 'on' as const, ar: `متصل (${this.c().online})`, dot: TONE_HEX.ok },
    { id: 'alert' as const, ar: `تنبيه (${this.c().offline})`, dot: TONE_HEX.crit },
  ]);
  protected readonly markers = computed(() => (this.filter() === 'all' ? this.o.camMarkers : this.o.camMarkers.filter((m) => (this.filter() === 'alert' ? m.tone === 'crit' : m.tone !== 'crit'))));

  protected readonly byZone = computed(() => barOptions(this.o.camByZone.map((z, i) => ({ label: `${z.label} · ${z.sub}`, value: Math.min(100, this.o.drift(z.value, i + 40, 0.01)) })), { max: 100, suffix: '%', color: TONE_HEX.ok }));
  protected readonly top = [
    { name: 'طريق الملك عبدالعزيز', id: 'C-104', place: 'تقاطع النور', n: 56 },
    { name: 'محيط المسجد النبوي', id: 'C-012', place: 'الساحة الشمالية', n: 49 },
    { name: 'طريق عمر بن الخطاب', id: 'C-238', place: 'محطة الميقات', n: 42 },
    { name: 'الدائري الثاني', id: 'C-409', place: 'جسر قباء', n: 38 },
    { name: 'تقاطع حي العزيزية', id: 'C-511', place: 'شارع الإمام البخاري', n: 34 },
  ];
  protected readonly conn = computed(() =>
    donutOptions(
      [
        { name: `متصلة: ${this.c().online} (${this.c().pct}%)`, y: this.c().online, color: TONE_HEX.ok },
        { name: `غير متصلة: ${this.c().offline} (${100 - this.c().pct}%)`, y: this.c().offline, color: TONE_HEX.crit },
      ],
      'كاميرا',
    ),
  );
  protected readonly hourly = lineOptions(this.o.camEventsHourly.labels, [{ name: 'الأحداث', data: this.o.camEventsHourly.data, color: TONE_HEX.brand }]);
  protected readonly types = donutOptions(
    [
      { name: 'ازدحام مروري 42%', y: 42, color: TONE_HEX.brand },
      { name: 'توقف مخالف 18%', y: 18, color: TONE_HEX.ok },
      { name: 'عكس اتجاه السير 14%', y: 14, color: TONE_HEX.warn },
      { name: 'عبور مشاة غير آمن 10%', y: 10, color: '#a5b4fc' },
      { name: 'جسم على الطريق 9%', y: 9, color: TONE_HEX.crit },
      { name: 'أخرى ومخاطر 7%', y: 7, color: '#94a3b8' },
    ],
    'إجمالي الأحداث',
  );
}
