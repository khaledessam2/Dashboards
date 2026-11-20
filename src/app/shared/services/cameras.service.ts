import { Injectable, computed, signal } from '@angular/core';

export interface CameraConfig {
  name: string;
  ip: string;
  location: { lat: number; lon: number };
}

export interface Camera extends CameraConfig {
  events24h: number;
  silent: boolean;
  /** Mock connection state (real source: Milestone XProtect MIP). */
  online: boolean;
}

// Real gateway: base URL of a stream server serving browser-playable video (MP4/WebM). RTSP can't play in <video>.
export const STREAM_GATEWAY = '';

export const HARAM_CENTER: [number, number] = [24.4672, 39.6111];

const MOCK: Array<CameraConfig & { events24h: number }> = [
  { name: 'كاميرا 01', ip: '10.0.30.1', location: { lat: 24.4698, lon: 39.6098 }, events24h: 169 },
  { name: 'كاميرا 03', ip: '10.0.30.3', location: { lat: 24.469, lon: 39.6126 }, events24h: 247 },
  { name: 'كاميرا 05', ip: '10.0.30.5', location: { lat: 24.4668, lon: 39.607 }, events24h: 52 },
  { name: 'كاميرا 07', ip: '10.0.30.7', location: { lat: 24.4676, lon: 39.6143 }, events24h: 190 },
  { name: 'كاميرا 09', ip: '10.0.30.9', location: { lat: 24.4684, lon: 39.6075 }, events24h: 47 },
  { name: 'كاميرا 10', ip: '10.0.30.10', location: { lat: 24.4655, lon: 39.6138 }, events24h: 141 },
  { name: 'كاميرا 12', ip: '10.0.30.12', location: { lat: 24.4705, lon: 39.6112 }, events24h: 58 },
  { name: 'كاميرا 14', ip: '10.0.30.14', location: { lat: 24.4646, lon: 39.6112 }, events24h: 111 },
  { name: 'كاميرا 16', ip: '10.0.30.16', location: { lat: 24.4662, lon: 39.6158 }, events24h: 41 },
  { name: 'كاميرا 18', ip: '10.0.30.18', location: { lat: 24.465, lon: 39.6082 }, events24h: 56 },
  { name: 'كاميرا 20', ip: '10.0.30.20', location: { lat: 24.4638, lon: 39.6095 }, events24h: 44 },
  { name: 'كاميرا 21', ip: '10.0.30.21', location: { lat: 24.4672, lon: 39.6055 }, events24h: 0 },
  { name: 'كاميرا 22', ip: '10.0.30.22', location: { lat: 24.4715, lon: 39.6135 }, events24h: 49 },
  { name: 'كاميرا 24', ip: '10.0.30.24', location: { lat: 24.4632, lon: 39.613 }, events24h: 34 },
  { name: 'كاميرا 26', ip: '10.0.30.26', location: { lat: 24.47, lon: 39.615 }, events24h: 0 },
];

@Injectable({ providedIn: 'root' })
export class CamerasService {
  readonly cameras = signal<Camera[]>(MOCK.map((c) => ({ ...c, silent: c.events24h === 0, online: c.events24h > 0 })));
  streamUrl(camera: Camera): string | null {
    return STREAM_GATEWAY ? `${STREAM_GATEWAY}/${camera.ip}` : null;
  }
}
