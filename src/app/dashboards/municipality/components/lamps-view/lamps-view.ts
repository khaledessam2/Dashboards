import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, computed, effect, inject, signal, viewChild } from '@angular/core';
import * as L from 'leaflet';
import { HARAM_CENTER } from '../../../../shared/services/cameras.service';
import { MunicipalityStore } from '../../../../shared/services/municipality-store';
import { ALERT_META, Lamp, MODE_META, STATUS_META } from '../../../../shared/models/municipality.model';

const LIST_LIMIT = 100;

@Component({
  selector: 'app-muni-lamps-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'card' },
  templateUrl: './lamps-view.html',
  styles: `
    :host ::ng-deep .lamp-tiles { filter: invert(1) hue-rotate(180deg) brightness(.85) contrast(.9) saturate(.6); }
    :host ::ng-deep .lamp-icon { background: none; border: 0; }
    :host ::ng-deep .lamp-bulb, :host .lamp-bulb { font-variation-settings: 'FILL' 1; font-size: 26px; line-height: 1; display: block; text-shadow: 0 0 3px #fff, 0 0 2px #fff; }
  `,
})
export class MuniLampsView {
  private readonly container = viewChild.required<ElementRef<HTMLElement>>('map');
  private readonly store = inject(MunicipalityStore);

  protected readonly view = signal<'map' | 'list'>('map');
  protected readonly query = signal('');
  protected readonly legend = Object.values(STATUS_META);
  protected readonly statusMeta = STATUS_META;
  protected readonly alertMeta = ALERT_META;
  protected readonly modeMeta = MODE_META;

  private readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const lamps = this.store.lamps();
    return q ? lamps.filter((l) => l.name.toLowerCase().includes(q) || l.id.toLowerCase().includes(q)) : lamps;
  });
  protected readonly rows = computed(() => this.filtered().slice(0, LIST_LIMIT));
  protected readonly matchCount = computed(() => this.filtered().length);

  private map?: L.Map;
  private readonly layer = L.layerGroup();

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this.map = L.map(this.container().nativeElement, {
        center: HARAM_CENTER,
        zoom: 15,
        zoomControl: true,
        attributionControl: false,
        preferCanvas: true,
      });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, className: 'lamp-tiles' }).addTo(this.map);
      this.layer.addTo(this.map);
      this.render(this.filtered());
      const ro = new ResizeObserver(() => this.map?.invalidateSize());
      ro.observe(this.container().nativeElement);
      destroyRef.onDestroy(() => {
        ro.disconnect();
        this.map?.remove();
      });
    });
    effect(() => this.render(this.filtered()));
    effect(() => {
      if (this.view() === 'map') setTimeout(() => this.map?.invalidateSize());
    });
  }

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  private render(lamps: Lamp[]): void {
    if (!this.map) return;
    this.layer.clearLayers();
    for (const l of lamps) {
      const meta = STATUS_META[l.status];
      L.marker([l.lat, l.lon], {
        icon: L.divIcon({
          className: 'lamp-icon',
          html: `<span class="material-symbols-outlined lamp-bulb" style="color:${meta.color}">lightbulb</span>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        }),
      })
        .bindTooltip(`${l.name} — ${meta.ar}${l.alert ? ` (${ALERT_META[l.alert].ar})` : ''}`)
        .addTo(this.layer);
    }
  }
}
