import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, NgZone, afterNextRender, effect, inject, viewChild } from '@angular/core';
import * as L from 'leaflet';
import { LayerId, TrafficCommandStore } from '../../../../shared/services/traffic-command-store';
import { PILL, TEXT } from '../../traffic-ui';

type Pt = [lat: number, lon: number];

const C: Pt = [24.4672, 39.6112];
const AIRPORT: Pt = [24.5534, 39.7051];
const STATION: Pt = [24.5560, 39.7870];

interface Pin { label?: string; key: string; layer: LayerId | 'hubs'; ll: Pt; bg: string; text: string; shape: 'circle' | 'square' | 'pill'; size?: number; pulse?: boolean }
const PINS: Pin[] = [
  { key: 'central_area', layer: 'hubs', ll: C, bg: '#10b981', text: 'mosque', shape: 'circle', size: 30 },
  { key: 'airport_hub', layer: 'hubs', ll: AIRPORT, bg: '#0b5cff', text: 'flight_land', label: 'مطار الأمير محمد', shape: 'pill' },
  { key: 'train_hub', layer: 'hubs', ll: STATION, bg: '#0b5cff', text: 'train', label: 'قطار الحرمين', shape: 'pill' },
  { key: 'closure_vip', layer: 'closures', ll: [24.4672, 39.6275], bg: '#7c3aed', text: 'remove_road', shape: 'circle', size: 28 },
  { key: 'roadwork_1', layer: 'closures', ll: [24.4790, 39.5990], bg: '#f59e0b', text: 'construction', shape: 'circle', size: 26 },
  { key: 'park_central', layer: 'parking', ll: [24.4735, 39.6045], bg: '#0b5cff', text: 'local_parking', shape: 'square', size: 26 },
  { key: 'park_shuhada', layer: 'parking', ll: [24.5000, 39.6190], bg: '#10b981', text: 'local_parking', shape: 'square', size: 26 },
  { key: 'park_aliyah', layer: 'parking', ll: [24.4320, 39.6420], bg: '#10b981', text: 'local_parking', shape: 'square', size: 26 },
  { key: 'acc_911', layer: 'hazards', ll: [24.4585, 39.6042], bg: '#e11d48', text: 'car_crash', shape: 'circle', size: 28, pulse: true },
  { key: 'hazard_water', layer: 'hazards', ll: [24.4672, 39.5800], bg: '#0ea5e9', text: 'water_drop', shape: 'circle', size: 28 },
  { key: 'alert_wrongway', layer: 'hazards', ll: [24.4625, 39.6005], bg: '#e11d48', text: 'u_turn_left', shape: 'circle', size: 28, pulse: true },
  { key: 'alert_parking', layer: 'hazards', ll: [24.4695, 39.6200], bg: '#f59e0b', text: 'block', shape: 'circle', size: 28 },
  { key: 'cong_quba', layer: 'hazards', ll: [24.4552, 39.6112], bg: '#e11d48', text: 'traffic', shape: 'circle', size: 28 },
  { key: 'cong_ring1', layer: 'hazards', ll: [24.4672, 39.5952], bg: '#e11d48', text: 'traffic', shape: 'circle', size: 28 },
];

const CAMERAS: Pt[] = [[24.4640, 39.6000], [24.4552, 39.6112], [24.4695, 39.6200], [24.4672, 39.5952], [24.4760, 39.6112]];

const pinIcon = (p: Pin): L.DivIcon => {
  const size = p.size ?? 26;
  const base = `display:flex;align-items:center;justify-content:center;color:#fff;background:${p.bg};border:2px solid #fff;box-shadow:0 1px 3px rgba(16,24,40,.35);font:700 12px 'IBM Plex Sans Arabic','Cairo',sans-serif;`;
  if (p.shape === 'pill') {
    return L.divIcon({ className: 'heat-pin-wrap', iconSize: [120, 30], iconAnchor: [60, 15], html: `<div style="${base}height:30px;padding:0 10px;gap:6px;border-radius:9px;white-space:nowrap;direction:rtl"><span class="material-symbols-outlined" style="font-size:18px">${p.text}</span>${p.label ?? ''}</div>` });
  }
  const radius = p.shape === 'square' ? '6px' : '9999px';
  return L.divIcon({
    className: 'heat-pin-wrap', iconSize: [size, size], iconAnchor: [size / 2, size / 2],
    html: `<div class="${p.pulse ? 'tm-pulse' : ''}" style="${base}width:${size}px;height:${size}px;border-radius:${radius};cursor:pointer"><span class="material-symbols-outlined" style="font-size:${Math.round(size * 0.66)}px">${p.text}</span></div>`,
  });
};

@Component({
  selector: 'app-traffic-road-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'pcard grow shrink-0 !gap-3' },
  templateUrl: './road-map.html',
  styles: `
    :host ::ng-deep .tm-pulse { animation: tm-pulse 1.4s ease-out infinite; }
    :host ::ng-deep .tm-tip { font: 600 12px 'IBM Plex Sans Arabic','Cairo',sans-serif; direction: rtl; border: 1px solid #e6ebf2; border-radius: 6px; box-shadow: none; }
    @keyframes tm-pulse { 0% { box-shadow: 0 0 0 0 rgba(225,29,72,.6); } 100% { box-shadow: 0 0 0 14px rgba(225,29,72,0); } }
  `,
})
export class RoadMap {
  protected readonly store = inject(TrafficCommandStore);
  protected readonly pill = PILL;
  protected readonly text = TEXT;
  private readonly container = viewChild.required<ElementRef<HTMLElement>>('map');
  private readonly zone = inject(NgZone);

  protected readonly layerButtons: { id: LayerId; ar: string; color: string }[] = [
        { id: 'hazards', ar: 'الحوادث والمخاطر', color: '#e11d48' },
    { id: 'closures', ar: 'الإغلاقات والحفريات', color: '#f59e0b' },
    { id: 'parking', ar: 'المواقف والترددي', color: '#0b5cff' },
    { id: 'cameras', ar: 'تغطية الكاميرات', color: '#0891b2' },
  ];

  protected readonly legend = [
    { color: '#e11d48', ar: 'حادث / ازدحام / تنبيه كاميرا' },
    { color: '#0ea5e9', ar: 'مخاطر مياه وبلدية' },
    { color: '#f59e0b', ar: 'إغلاق / حفريات / وقوف مخالف' },
    { color: '#0b5cff', ar: 'مواقف ومراكز نقل' },
  ];

  private map?: L.Map;
  private readonly groups = new Map<string, L.LayerGroup>();

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const map = L.map(this.container().nativeElement, { center: C, zoom: 14, minZoom: 10, maxZoom: 18, zoomControl: true, attributionControl: true, scrollWheelZoom: false, zoomSnap: 0.5 });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, className: 'heat-tiles', attribution: '© OpenStreetMap' }).addTo(map);
      this.map = map;
      this.build();
      map.fitBounds(L.latLngBounds(PINS.filter((p) => !['park_shuhada', 'park_aliyah', 'airport_hub', 'train_hub'].includes(p.key)).map((p) => p.ll)), { padding: [30, 30], maxZoom: 15.5 });
      this.apply();
      const ro = new ResizeObserver(() => map.invalidateSize());
      ro.observe(this.container().nativeElement);
      destroyRef.onDestroy(() => { ro.disconnect(); map.remove(); });
    });
    effect(() => { this.store.layers(); this.apply(); });
  }

  private select(key: string): void {
    this.zone.run(() => this.store.selectedKey.set(key));
  }

  private group(id: string): L.LayerGroup {
    let g = this.groups.get(id);
    if (!g) { g = L.layerGroup(); this.groups.set(id, g); }
    return g;
  }

  private build(): void {
    for (const p of PINS) {
      const m = L.marker(p.ll, { icon: pinIcon(p) });
      m.on('click', () => this.select(p.key));
      this.group(p.layer).addLayer(m);
    }
    for (const ll of CAMERAS) {
      this.group('cameras').addLayer(L.circle(ll, { radius: 380, color: '#0891b2', weight: 1, fillColor: '#0891b2', fillOpacity: 0.18 }));
      this.group('cameras').addLayer(L.circleMarker(ll, { radius: 4, color: '#fff', weight: 1.5, fillColor: '#0891b2', fillOpacity: 1 }));
    }
  }

  private apply(): void {
    const map = this.map;
    if (!map) return;
    const l = this.store.layers();
    const show: Record<string, boolean> = { hubs: true, closures: l.closures, parking: l.parking, hazards: l.hazards, cameras: l.cameras };
    for (const [id, g] of this.groups) {
      const on = show[id] ?? true;
      if (on && !map.hasLayer(g)) g.addTo(map);
      if (!on && map.hasLayer(g)) map.removeLayer(g);
    }
  }
}
