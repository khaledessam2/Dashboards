import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, computed, effect, inject, signal, viewChild } from '@angular/core';
import * as L from 'leaflet';
import { Camera, CamerasService } from '../../../../shared/services/cameras.service';
import { CameraPopup } from '../../../traffic/components/camera-popup/camera-popup';
import { HeatLayer } from 'leaflet.heat';
import { PoliceStore } from '../../../../shared/services/police-store';
import { LEVEL_HEX, LEVEL_WORD, Level, PILL, TEXT, fmt } from '../ops-ui';

type Layer = 'density' | 'gates' | 'alerts' | 'routes';
type Pt = [lat: number, lon: number];

const CENTER: Pt = [24.4672, 39.6112];

interface ZoneGeo {
  shape: { kind: 'rect'; bounds: [Pt, Pt] } | { kind: 'circle'; center: Pt; radius: number };
  offset: [number, number];
  hot: Array<[number, number, number]>;
}

const GEO: Record<string, ZoneGeo> = {
  main: {
    shape: { kind: 'rect', bounds: [[24.4685, 39.609], [24.466, 39.6134]] }, offset: [0, -48],
    hot: [[24.4668, 39.6102, 0.6], [24.4676, 39.6106, 0.55], [24.4679, 39.6122, 0.55], [24.4664, 39.6122, 0.5], [24.4672, 39.6128, 0.5]],
  },
  rawdah: {
    shape: { kind: 'circle', center: [24.46712, 39.61155], radius: 32 }, offset: [0, 40],
    hot: [[24.46712, 39.61155, 1], [24.46725, 39.61185, 0.8]],
  },
  north: {
    shape: { kind: 'circle', center: [24.4691, 39.6112], radius: 85 }, offset: [0, 0],
    hot: [[24.4685, 39.6112, 0.85], [24.4692, 39.6111, 0.7], [24.4699, 39.6111, 0.9]],
  },
  south: {
    shape: { kind: 'circle', center: [24.4652, 39.6111], radius: 85 }, offset: [0, 0],
    hot: [[24.4655, 39.6111, 0.85], [24.4649, 39.6111, 0.7], [24.4642, 39.6111, 0.9]],
  },
  west: {
    shape: { kind: 'circle', center: [24.4672, 39.6075], radius: 70 }, offset: [0, 0],
    hot: [[24.4672, 39.6085, 0.9], [24.4672, 39.6075, 0.7], [24.4672, 39.6066, 0.8]],
  },
  east: {
    shape: { kind: 'circle', center: [24.4672, 39.615], radius: 70 }, offset: [0, 0],
    hot: [[24.4672, 39.614, 0.9], [24.4672, 39.615, 0.75], [24.4672, 39.6159, 0.85]],
  },
};

const GATES: Array<{ at: Pt; label: string; color: string }> = [
  { at: [24.47, 39.6111], label: '21', color: '#10b981' },
  { at: [24.4672, 39.607], label: '8', color: '#10b981' },
  { at: [24.4672, 39.6155], label: '34', color: '#10b981' },
  { at: [24.464, 39.6111], label: '5', color: '#10b981' },
  { at: [24.4672, 39.6122], label: 'سلام', color: '#f59e0b' },
  { at: [24.4673, 39.615], label: 'بقيع', color: '#e11d48' },
];
const ALERTS: Array<{ at: Pt; color: string }> = [
  { at: [24.4684, 39.6118], color: '#e11d48' },
  { at: [24.4668, 39.6095], color: '#f59e0b' },
  { at: [24.4654, 39.6118], color: '#f59e0b' },
];
const ROUTES: Array<{ points: Pt[]; color: string }> = [
  { points: [[24.4672, 39.6122], [24.465, 39.6122], [24.465, 39.61]], color: '#f59e0b' },
  { points: [[24.4673, 39.615], [24.4655, 39.615], [24.4655, 39.6125]], color: '#059669' },
];

const ZONE_CAMERA: Record<string, string> = { rawdah: '10.0.30.24', main: '10.0.30.14', north: '10.0.30.20', south: '10.0.30.16', west: '10.0.30.5', east: '10.0.30.18' };

const centerOf = (id: string): Pt => {
  const s = GEO[id].shape;
  return s.kind === 'circle' ? s.center : [(s.bounds[0][0] + s.bounds[1][0]) / 2, (s.bounds[0][1] + s.bounds[1][1]) / 2];
};

const HEAT_GRADIENT = { 0.2: '#10b981', 0.55: '#facc15', 1: '#e11d48' };

const pin = (label: string, color: string, size = 26) =>
  L.divIcon({ className: 'heat-pin-wrap', iconSize: [size, size], html: `<div class="heat-pin" style="background:${color};width:${size}px;height:${size}px">${label}</div>` });

@Component({
  selector: 'app-police-live-map',
  imports: [CameraPopup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'pcard !p-0 overflow-hidden' },
  templateUrl: './live-map.html',
})
export class PoliceLiveMap {
  protected readonly store = inject(PoliceStore);
  protected readonly pill = PILL;
  protected readonly text = TEXT;
  protected readonly levelWord = LEVEL_WORD;
  protected readonly fmt = fmt;

  protected readonly layers = signal<Record<Layer, boolean>>({ density: true, gates: true, alerts: true, routes: true });
  protected readonly layerButtons: Array<{ id: Layer; ar: string; color: string }> = [
    { id: 'density', ar: 'كثافة الحشود', color: '#e11d48' },
    { id: 'gates', ar: 'الأبواب', color: '#10b981' },
    { id: 'alerts', ar: 'البلاغات', color: '#f59e0b' },
    { id: 'routes', ar: 'مسارات الإخلاء', color: '#059669' },
  ];
  protected toggleLayer(id: Layer): void {
    this.layers.update((l) => ({ ...l, [id]: !l[id] }));
  }

  protected readonly selectedId = signal('rawdah');
  protected readonly selected = computed(() => this.store.zoneRows().find((z) => z.id === this.selectedId()) ?? this.store.zoneRows()[0]);

  protected readonly hiddenLevels = signal<Level[]>([]);
  protected readonly legend: Array<{ id: Level; ar: string; hint: string }> = [
    { id: 'bad', ar: 'حرج', hint: '> 5 أشخاص/م²' },
    { id: 'warn', ar: 'تحذير', hint: '3.5 - 5 أشخاص/م²' },
    { id: 'ok', ar: 'طبيعي', hint: '< 3.5 أشخاص/م²' },
  ];
  protected readonly legendColor = LEVEL_HEX;
  protected readonly levelCounts = computed(() => {
    const c: Record<Level, number> = { ok: 0, warn: 0, bad: 0 };
    for (const z of this.store.zoneRows()) c[z.level]++;
    return c;
  });
  protected toggleLevel(l: Level): void {
    this.hiddenLevels.update((h) => (h.includes(l) ? h.filter((x) => x !== l) : [...h, l]));
  }

  protected readonly panelsOpen = signal(true);
  protected readonly camera = signal<Camera | null>(null);
  private readonly cameras = inject(CamerasService).cameras;
  protected openCamera(): void {
    this.camera.set(this.cameras().find((c) => c.ip === ZONE_CAMERA[this.selectedId()]) ?? null);
  }

  protected selectZone(id: string): void {
    this.selectedId.set(id);
    this.map?.flyTo(centerOf(id), id === 'rawdah' ? 18 : 17, { duration: 0.8 });
  }
  protected resetView(): void {
    this.map?.flyTo(CENTER, 17, { duration: 0.8 });
  }

  private readonly container = viewChild.required<ElementRef<HTMLElement>>('map');
  private readonly ready = signal(false);
  private map?: L.Map;
  private heat?: HeatLayer;
  private readonly zoneShapes = new Map<string, L.Path>();
  private readonly gateGroup = L.layerGroup();
  private readonly alertGroup = L.layerGroup();
  private readonly routeGroup = L.layerGroup();

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const map = L.map(this.container().nativeElement, { center: CENTER, zoom: 17, minZoom: 15, maxZoom: 19, zoomControl: false, attributionControl: true, scrollWheelZoom: false });
      this.map = map;
      map.attributionControl.setPrefix(false);
      L.control.zoom({ position: 'topleft' }).addTo(map);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, className: 'heat-tiles', attribution: '© OpenStreetMap' }).addTo(map);

      this.heat = new HeatLayer([], { radius: 48, blur: 34, max: 1, minOpacity: 0.4, maxZoom: 17, gradient: HEAT_GRADIENT });

      for (const [id, g] of Object.entries(GEO)) {
        const style: L.PathOptions = { color: '#94a3b8', weight: 1.5, dashArray: '6 5', fillColor: '#ffffff', fillOpacity: 0.05 };
        const shape: L.Path = g.shape.kind === 'rect' ? L.rectangle(g.shape.bounds, style) : L.circle(g.shape.center, { ...style, radius: g.shape.radius });
        shape.bindTooltip('', { permanent: true, direction: 'center', className: 'heat-label', offset: g.offset, interactive: false });
        shape.on('click', () => this.selectZone(id));
        shape.addTo(map);
        this.zoneShapes.set(id, shape);
      }
      this.zoneShapes.get('rawdah')?.bringToFront();

      for (const g of GATES) L.marker(g.at, { icon: pin(g.label, g.color, g.label.length > 2 ? 34 : 26), keyboard: false }).addTo(this.gateGroup);
      for (const a of ALERTS) L.marker(a.at, { icon: pin('!', a.color, 22), keyboard: false }).addTo(this.alertGroup);
      for (const r of ROUTES) L.polyline(r.points, { color: r.color, weight: 4, dashArray: '9 7', opacity: 0.9 }).addTo(this.routeGroup);

      const ro = new ResizeObserver(() => map.invalidateSize());
      ro.observe(this.container().nativeElement);
      destroyRef.onDestroy(() => {
        ro.disconnect();
        map.remove();
      });
      this.ready.set(true);
    });

    effect(() => {
      const zones = this.store.zoneRows();
      const layers = this.layers();
      const selected = this.selectedId();
      const hidden = this.hiddenLevels();
      if (!this.ready() || !this.map || !this.heat) return;
      this.sync(zones, layers, selected, hidden);
    });
  }

  private sync(zones: ReturnType<PoliceStore['zoneRows']>, layers: Record<Layer, boolean>, selected: string, hidden: Level[]): void {
    const map = this.map!;
    const points: Array<[number, number, number]> = [];
    for (const z of zones) {
      const g = GEO[z.id];
      if (!g) continue;
      const k = Math.min(Math.max(z.density / 5.5, 0.15), 1);
      const off = hidden.includes(z.level);
      if (!off) for (const [lat, lon, w] of g.hot) points.push([lat, lon, +Math.min(w * k, 1).toFixed(2)]);
      const shape = this.zoneShapes.get(z.id);
      if (shape) {
        shape.setTooltipContent(`${z.short} · ${z.occ}%`);
        shape.setStyle(z.id === selected ? { color: '#059669', weight: 3, dashArray: '', opacity: 1 } : { color: '#94a3b8', weight: 1.5, dashArray: '6 5', opacity: off ? 0.25 : 1 });
        shape.getTooltip()?.getElement()?.classList.toggle('heat-label-dim', off);
      }
    }
    this.heat!.setLatLngs(points);

    const toggle = (layer: L.Layer, on: boolean) => {
      if (on && !map.hasLayer(layer)) layer.addTo(map);
      if (!on && map.hasLayer(layer)) map.removeLayer(layer);
    };
    toggle(this.heat as unknown as L.Layer, layers.density);
    toggle(this.gateGroup, layers.gates);
    toggle(this.alertGroup, layers.alerts);
    toggle(this.routeGroup, layers.routes);
  }
}
