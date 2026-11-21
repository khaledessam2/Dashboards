import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, NgZone, afterNextRender, effect, inject, viewChild } from '@angular/core';
import * as L from 'leaflet';
import { DISTRICTS, Incident, MuniLayerId, MunicipalityCommandStore, TYPE_META } from '../../../../shared/services/municipality-command-store';

const C: [number, number] = [24.4672, 39.6112];

const pinIcon = (i: Incident, selected: boolean): L.DivIcon => {
  const m = TYPE_META[i.type];
  const size = selected ? 34 : 28;
  const pulse = i.priority === 'critical' ? 'mm-pulse' : '';
  return L.divIcon({
    className: 'heat-pin-wrap', iconSize: [size, size], iconAnchor: [size / 2, size / 2],
    html: `<div class="${pulse}" style="display:flex;align-items:center;justify-content:center;color:#fff;background:${i.priority === 'critical' ? '#e11d48' : m.color};border:${selected ? 3 : 2}px solid #fff;box-shadow:0 1px 3px rgba(16,24,40,.35);width:${size}px;height:${size}px;border-radius:9999px;cursor:pointer"><span class="material-symbols-outlined" style="font-size:${Math.round(size * 0.62)}px">${m.icon}</span></div>`,
  });
};

@Component({
  selector: 'app-muni-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'pcard grow shrink-0 !gap-3' },
  templateUrl: './muni-map.html',
  styles: `
    :host ::ng-deep .mm-pulse { animation: mm-pulse 1.4s ease-out infinite; }
    :host ::ng-deep .mm-district { font: 700 12px 'IBM Plex Sans Arabic','Cairo',sans-serif; direction: rtl; color: #334155; background: rgba(255,255,255,.88); border: 1px solid #e6ebf2; border-radius: 6px; padding: 2px 8px; white-space: nowrap; }
    :host ::ng-deep .mm-district.on { background: #0b5cff; color: #fff; border-color: #0b5cff; }
    @keyframes mm-pulse { 0% { box-shadow: 0 0 0 0 rgba(225,29,72,.6); } 100% { box-shadow: 0 0 0 14px rgba(225,29,72,0); } }
  `,
})
export class MuniMap {
  protected readonly store = inject(MunicipalityCommandStore);
  private readonly container = viewChild.required<ElementRef<HTMLElement>>('map');
  private readonly zone = inject(NgZone);

  protected readonly layerButtons = (Object.keys(TYPE_META) as MuniLayerId[]).map((id) => ({ id, ar: TYPE_META[id].ar, color: TYPE_META[id].color }));
  protected readonly legend = [
    { color: '#e11d48', ar: 'حالة حرجة' },
    ...this.layerButtons.map((b) => ({ color: b.color, ar: b.ar })),
  ];

  private map?: L.Map;
  private readonly pins = L.layerGroup();
  private readonly labels = L.layerGroup();

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const map = L.map(this.container().nativeElement, { center: C, zoom: 13, minZoom: 10, maxZoom: 18, zoomControl: true, scrollWheelZoom: false, zoomSnap: 0.5 });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, className: 'heat-tiles', attribution: '© OpenStreetMap' }).addTo(map);
      this.map = map;
      this.pins.addTo(map);
      this.labels.addTo(map);
      this.render();
      map.fitBounds(L.latLngBounds(DISTRICTS.filter((d) => d.key !== 'airport').map((d) => d.ll)), { padding: [40, 40], maxZoom: 14 });
      const ro = new ResizeObserver(() => map.invalidateSize());
      ro.observe(this.container().nativeElement);
      destroyRef.onDestroy(() => { ro.disconnect(); map.remove(); });
    });
    effect(() => { this.store.filtered(); this.store.layers(); this.store.selectedUid(); this.render(); });
  }

  private render(): void {
    if (!this.map) return;
    const layers = this.store.layers();
    const sel = this.store.selectedUid();
    this.pins.clearLayers();
    this.labels.clearLayers();
    for (const d of DISTRICTS) {
      const m = L.marker(d.ll, { icon: L.divIcon({ className: 'heat-pin-wrap', iconSize: [0, 0], html: `<div class="mm-district " style="transform:translate(-50%,-50%)">${d.ar.split(' (')[0]}</div>` }), zIndexOffset: -500 });
      this.labels.addLayer(m);
    }
    for (const i of this.store.filtered()) {
      if (!layers[i.type]) continue;
      const m = L.marker(i.ll, { icon: pinIcon(i, i.uid === sel), zIndexOffset: i.uid === sel ? 1000 : 0 });
      m.on('click', () => this.zone.run(() => this.store.selectedUid.set(i.uid)));
      this.pins.addLayer(m);
    }
  }
}
