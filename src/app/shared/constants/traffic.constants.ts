import { EventName } from '../models/traffic-event.model';

export const EVENT_META: Record<EventName, { ar: string; icon: string; severity: 'critical' | 'warning' }> = {
  'Crosswalk Violation': { ar: 'مخالفة عبور المشاة', icon: 'directions_walk', severity: 'warning' },
  'Wrong Way': { ar: 'عكس الاتجاه', icon: 'swap_vert', severity: 'critical' },
  'Parking Overstay': { ar: 'وقوف مخالف', icon: 'local_parking', severity: 'critical' },
  'Illegal Taxi': { ar: 'تاكسي غير نظامي', icon: 'local_taxi', severity: 'critical' },
  'Road Congestion': { ar: 'ازدحام مروري', icon: 'traffic', severity: 'warning' },
  'Flyover Congestion': { ar: 'ازدحام جسر', icon: 'add_road', severity: 'warning' },
};

export const COLOR_RED = '#e74c3c';
export const COLOR_AMBER = '#f5a623';
export const COLOR_GREEN = '#00a651';
