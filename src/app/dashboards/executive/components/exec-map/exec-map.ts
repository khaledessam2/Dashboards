import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, NgZone, afterNextRender, effect, inject, signal, viewChild } from '@angular/core';
import * as L from 'leaflet';
import { ExecutiveStore } from '../../../../shared/services/executive-store';
import { BLIND_CIRCLE, BLIND_POLY, CAMERA_ANCHORS, CENTER, INCIDENTS, LayerId } from '../../executive.data';

const pinIcon = (n: number, color: string, size: number): L.DivIcon =>
  L.divIcon({
    className: 'heat-pin-wrap', iconSize: [size, size], iconAnchor: [size / 2, size / 2],
    html: `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:9999px;background:${color};color:#fff;border:2px solid #fff;box-shadow:0 1px 4px rgba(16,24,40,.4);font:700 13px 'IBM Plex Sans Arabic','Cairo',sans-serif;cursor:pointer">${n}</div>`,
  });

const squareIcon = (icon: string, color: string): L.DivIcon =>
  L.divIcon({
    className: 'heat-pin-wrap', iconSize: [22, 22], iconAnchor: [11, 11],
    html: `<div style="display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:6px;background:#fff;color:${color};border:2px solid ${color}"><span class="material-symbols-outlined" style="font-size:14px">${icon}</span></div>`,
  });

@Component({
  selector: 'app-exec-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'pcard min-h-[620px] !gap-0 overflow-hidden !p-0' },
  templateUrl: './exec-map.html',
})
export class ExecMap {
  protected readonly store = inject(ExecutiveStore);
  private readonly zone = inject(NgZone);

  protected readonly layerButtons: { id: LayerId; ar: string; on: string }[] = [
    { id: 'incidents', ar: 'الحالات الموحدة والآثار', on: 'border-[#e11d48]/40 bg-[#fff1f2] text-[#e11d48]' },
    { id: 'proximity', ar: 'الجوار والتأثير المكاني', on: 'border-[#059669]/40 bg-[#ecfdf5] text-[#059669]' },
    { id: 'blindspots', ar: 'نقص الرؤية والبيانات', on: 'border-[#d97706]/40 bg-[#fffbeb] text-[#d97706]' },
  ];
  protected readonly layers = signal<Record<LayerId, boolean>>({ incidents: true, proximity: true, blindspots: true });
  protected toggleLayer(id: LayerId): void {
    this.layers.update((l) => ({ ...l, [id]: !l[id] }));
  }

  protected readonly scope = signal<'city' | 'haram'>('city');
  protected setScope(s: 'city' | 'haram'): void {
    this.scope.set(s);
    const map = this.map;
    if (!map) return;
    if (s === 'haram') map.flyTo(CENTER, 16, { duration: 0.8 });
    else map.flyToBounds(this.cityBounds(), { padding: [30, 30], duration: 0.8 });
  }

  private readonly container = viewChild.required<ElementRef<HTMLElement>>('map');
  private map?: L.Map;
  private readonly ready = signal(false);
  private readonly groups: Record<LayerId, L.LayerGroup> = { incidents: L.layerGroup(), proximity: L.layerGroup(), blindspots: L.layerGroup() };
  private impact?: L.Circle;

  private cityBounds(): L.LatLngBounds {
    return L.latLngBounds([...INCIDENTS.map((i) => i.at), CENTER, BLIND_CIRCLE.at, ...BLIND_POLY]);
  }

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const map = L.map(this.container().nativeElement, { center: CENTER, zoom: 14, minZoom: 12, maxZoom: 18, zoomControl: true, attributionControl: true, scrollWheelZoom: false, zoomSnap: 0.5 });
      this.map = map;
      map.attributionControl.setPrefix(false);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, className: 'heat-tiles', attribution: '© OpenStreetMap' }).addTo(map);

      // Haram core (always visible)
      L.rectangle([[24.4660, 39.6090], [24.4685, 39.6134]], { color: '#059669', weight: 2, fillColor: '#10b981', fillOpacity: 0.35 })
        .bindTooltip('الحرم النبوي', { permanent: true, direction: 'center', className: 'heat-label', interactive: false })
        .addTo(map);

      // Layer: proximity (impact radius, camera anchors)
      this.impact = L.circle(INCIDENTS[0].at, { radius: INCIDENTS[0].radius, color: '#e11d48', weight: 1.5, dashArray: '5 4', fillColor: '#e11d48', fillOpacity: 0.12, interactive: false }).addTo(this.groups.proximity);
      for (const c of CAMERA_ANCHORS) {
        L.marker(c, { icon: squareIcon('videocam', '#059669') }).on('click', () => this.zone.run(() => this.store.openDrawer('inc1'))).addTo(this.groups.proximity);
      }

      // Layer: blind spots
      const blindStyle: L.PathOptions = { color: '#d97706', weight: 1.5, dashArray: '6 4', fillColor: '#f59e0b', fillOpacity: 0.14 };
      L.polygon(BLIND_POLY, blindStyle)
        .bindTooltip('نقص رؤية · حساسات المواقف', { permanent: true, direction: 'center', className: 'heat-label', interactive: false })
        .on('click', () => this.zone.run(() => this.store.openDrawer('visibility')))
        .addTo(this.groups.blindspots);
      L.circle(BLIND_CIRCLE.at, { ...blindStyle, radius: BLIND_CIRCLE.radius })
        .bindTooltip('قراءة متأخرة', { permanent: true, direction: 'center', className: 'heat-label', interactive: false })
        .on('click', () => this.zone.run(() => this.store.openDrawer('visibility')))
        .addTo(this.groups.blindspots);

      // Layer: incidents
      for (const i of INCIDENTS) {
        L.marker(i.at, { icon: pinIcon(i.n, i.color, i.n === 1 ? 32 : 28), zIndexOffset: 500 })
          .on('mouseover', () => this.zone.run(() => this.store.focusId.set(i.id)))
          .on('click', () => this.zone.run(() => this.store.openDrawer(i.id)))
          .addTo(this.groups.incidents);
      }

      map.fitBounds(this.cityBounds(), { padding: [30, 30] });

      const ro = new ResizeObserver(() => map.invalidateSize());
      ro.observe(this.container().nativeElement);
      destroyRef.onDestroy(() => {
        ro.disconnect();
        map.remove();
      });
      this.ready.set(true);
    });

    effect(() => {
      const layers = this.layers();
      const f = this.store.focus();
      if (!this.ready() || !this.map) return;
      for (const id of Object.keys(this.groups) as LayerId[]) {
        const g = this.groups[id];
        if (layers[id] && !this.map.hasLayer(g)) g.addTo(this.map);
        if (!layers[id] && this.map.hasLayer(g)) this.map.removeLayer(g);
      }
      this.impact?.setLatLng(f.at).setRadius(f.radius).setStyle({ color: f.color, fillColor: f.color });
    });
  }
}
