export type EventName =
  'Crosswalk Violation' | 'Wrong Way' | 'Parking Overstay' |
  'Illegal Taxi' | 'Road Congestion' | 'Flyover Congestion'

export interface TrafficEvent {
  id: number;
  event_name: EventName;
  camera_id: string; // camera IP
  camera_name: string;
  event_time: number; // epoch ms
}
