import { ChangeDetectionStrategy, Component, DestroyRef, computed, ElementRef, NgZone, afterNextRender, effect, inject, signal, viewChild } from '@angular/core';
import * as L from 'leaflet';
import { Camera, CamerasService, HARAM_CENTER } from '../../../../shared/services/cameras.service';
import { TrafficStore } from '../../../../shared/services/traffic-store';

const CENTER: L.LatLngTuple = HARAM_CENTER; // Al-Masjid an-Nabawi
const OK = '#00a651';

function markerIcon(camera: Camera, flashing: boolean): L.DivIcon {
  const icon = (name: string) => `<span class="material-symbols-outlined" style="font-size:16px;line-height:1;color:#fff">${name}</span>`;
  const html = camera.silent
    ? `<div class="cam-pin cam-pin-problem" title="${camera.name}">${icon('videocam_off')}</div>`
    : `<div class="cam-pin${flashing ? ' cam-pin-flash' : ''}" style="background:${OK};cursor:pointer" title="${camera.name}">${icon('videocam')}</div>`;
  return L.divIcon({ html, className: '', iconSize: [28, 28], iconAnchor: [14, 14] });
}

@Component({
  selector: 'app-cam-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { id: 'cam-map', class: 'card', '(document:keydown.escape)': 'closeLive()' },
  templateUrl: './cam-map.html',
  styles: `
    :host ::ng-deep .cam-pin { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 2px solid #fff; box-sizing: border-box; box-shadow: 0 1px 4px rgba(0,0,0,.35); }
    :host ::ng-deep .cam-pin-problem { background: #e74c3c; cursor: pointer; animation: cam-pulse 1.4s ease-out infinite; }
    :host ::ng-deep .cam-pin-flash { background: #f5a623 !important; box-shadow: 0 0 0 5px rgba(245,166,35,.45); animation: marker-flash .9s ease-in-out infinite; }
    :host ::ng-deep .cam-tiles { filter: invert(1) hue-rotate(180deg) brightness(.85) contrast(.9) saturate(.6); }
    @keyframes cam-pulse { 0% { box-shadow: 0 0 0 0 rgba(231,76,60,.7); } 100% { box-shadow: 0 0 0 14px rgba(231,76,60,0); } }
  `,
})
export class CamMap {
  private readonly container = viewChild.required<ElementRef<HTMLElement>>('map');
  private readonly zone = inject(NgZone);
  private readonly service = inject(CamerasService);
  private readonly store = inject(TrafficStore);

  protected readonly liveCamera = signal<Camera | null>(null);
  protected readonly streamUrl = signal<string | null>(null);

  protected readonly activeCount = computed(() => this.service.cameras().filter((c) => !c.silent).length);
  protected readonly totalCount = computed(() => this.service.cameras().length);
  protected readonly downNames = computed(() =>
    this.service.cameras().filter((c) => c.silent).map((c) => c.name).join('، '),
  );

  private map?: L.Map;
  private layer = L.layerGroup();

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this.map = L.map(this.container().nativeElement, { center: CENTER, zoom: 15, zoomControl: true, attributionControl: false });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, className: 'cam-tiles' }).addTo(this.map);
      this.layer.addTo(this.map);
      this.render(this.service.cameras(), this.store.freshCameraIds());
      const ro = new ResizeObserver(() => this.map?.invalidateSize());
      ro.observe(this.container().nativeElement);
      destroyRef.onDestroy(() => {
        ro.disconnect();
        this.map?.remove();
      });
    });
    effect(() => this.render(this.service.cameras(), this.store.freshCameraIds()));
  }

  private render(cameras: Camera[], fresh: ReadonlySet<string>): void {
    if (!this.map) return;
    this.layer.clearLayers();
    for (const cam of cameras) {
      const marker = L.marker([cam.location.lat, cam.location.lon], { icon: markerIcon(cam, fresh.has(cam.ip)) }).addTo(this.layer);
      marker.bindTooltip(cam.silent ? `${cam.name} — ⚠ بدون أحداث 24 ساعة` : cam.name);
      marker.on('click', () => this.zone.run(() => this.openLive(cam)));
    }
  }

  private openLive(cam: Camera): void {
    this.streamUrl.set(this.service.streamUrl(cam));
    this.liveCamera.set(cam);
  }

  protected closeLive(): void {
    this.liveCamera.set(null);
  }
}
