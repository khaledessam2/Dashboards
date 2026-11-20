export type PoliceEventName =
  | 'Restricted Area Entry'
  | 'Left Object'
  | 'Overcrowd-30'
  | 'Overcrowd-50'
  | 'Trip Fall';

export interface PoliceEvent {
  id: number;
  event_name: PoliceEventName;
  camera_id: string; // camera IP
  camera_name: string;
  event_time: number; // epoch ms
}

export interface ZoneStat {
  ar: string;
  value: number;
}

export interface HourBucket {
  label: string;
  count: number;
}

export interface CameraSeries {
  name: string;
  total: number;
  data: number[];
}

