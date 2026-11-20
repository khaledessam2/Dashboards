import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CameraPopup } from '../../../traffic/components/camera-popup/camera-popup';
import { camId } from '../../../../shared/constants/police.constants';
import { Camera, CamerasService } from '../../../../shared/services/cameras.service';
import { PoliceStore } from '../../../../shared/services/police-store';

type Level = 'crit' | 'warn' | 'ok' | 'off';
const COLOR: Record<Level, string> = { crit: '#e11d48', warn: '#f59e0b', ok: '#10b981', off: '#94a3b8' };

/** Schematic map plane: 760 × 585. Camera nodes + coverage / heat circles (#15, #23). */
const NODES: Array<{ id: string; ip: string; x: number; y: number; level: Level }> = [
  { id: 'CAM-03', ip: '10.0.30.3', x: 319, y: 173, level: 'crit' },
  { id: 'CAM-01', ip: '10.0.30.1', x: 406, y: 200, level: 'crit' },
  { id: 'CAM-14', ip: '10.0.30.14', x: 530, y: 127, level: 'ok' },
  { id: 'CAM-18', ip: '10.0.30.18', x: 288, y: 292, level: 'warn' },
  { id: 'CAM-07', ip: '10.0.30.7', x: 492, y: 387, level: 'ok' },
  { id: 'CAM-21', ip: '10.0.30.21', x: 130, y: 470, level: 'off' },
];

const CIRCLES = [
  { cx: 450, cy: 274, r: 200, fill: 'rgba(148,163,184,0.10)', stroke: 'rgba(148,163,184,0.55)' },
  { cx: 333, cy: 163, r: 110, fill: 'rgba(225,29,72,0.10)', stroke: 'rgba(225,29,72,0.45)' },
  { cx: 333, cy: 163, r: 59, fill: 'rgba(225,29,72,0.14)', stroke: 'rgba(225,29,72,0.6)' },
  { cx: 273, cy: 305, r: 90, fill: 'rgba(245,158,11,0.14)', stroke: 'rgba(245,158,11,0.45)' },
  { cx: 485, cy: 397, r: 70, fill: 'rgba(11,92,255,0.10)', stroke: 'rgba(11,92,255,0.4)' },
];

@Component({
  selector: 'app-police-cam-map',
  imports: [CameraPopup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { id: 'cam-map', class: 'pcard !p-0 overflow-hidden' },
  templateUrl: './cam-map.html',
})
export class PoliceCamMap {
  private readonly store = inject(PoliceStore);
  private readonly cameras = inject(CamerasService).cameras;

  protected readonly circles = CIRCLES;
  protected readonly zoom = signal(1);
  protected readonly selected = signal<Camera | null>(null);
  protected readonly active = computed(() => this.store.cameraLink().online);
  protected readonly zoomTransform = computed(() => `translate(${380 * (1 - this.zoom())} ${292 * (1 - this.zoom())}) scale(${this.zoom()})`);
  protected readonly legend = [
    { color: COLOR.crit, ar: 'حدث حرج / طارئ' },
    { color: COLOR.warn, ar: 'تنبيه / تحذير أمني' },
    { color: COLOR.ok, ar: 'كاميرا متصلة ونشطة' },
    { color: COLOR.off, ar: 'كاميرا غير متصلة' },
  ];

  protected readonly nodes = computed(() => {
    const fresh = this.store.freshCameraIds();
    const cams = this.cameras();
    return NODES.map((n) => {
      const cam = cams.find((c) => c.ip === n.ip);
      const level: Level = cam && !cam.online ? 'off' : fresh.has(n.ip) && n.level === 'ok' ? 'warn' : n.level;
      return { ...n, id: cam ? camId(cam.name) : n.id, color: COLOR[level], fresh: fresh.has(n.ip) };
    });
  });

  protected open(ip: string): void {
    this.selected.set(this.cameras().find((c) => c.ip === ip) ?? null);
  }

  protected zoomBy(delta: number): void {
    this.zoom.update((z) => Math.min(1.6, Math.max(0.7, +(z + delta).toFixed(1))));
  }
}
