/** PRTG states used by the datacenter wall (KPI-Documentation §4.10). */
export type PrtgStatus = 'up' | 'down' | 'warning' | 'unusual' | 'paused';

export type SensorKind = 'ping' | 'cpu' | 'memory' | 'disk' | 'traffic' | 'temperature';

export interface Device {
  id: number;
  name: string;
  group: string;
  ip: string;
  status: PrtgStatus;
}

export interface Sensor {
  id: number;
  deviceId: number;
  kind: SensorKind;
  status: PrtgStatus;
  /** ping ms · cpu % · memory GB used · disk % · traffic Mbit/s · temperature °C */
  value: number;
}

export type AlertSeverity = 'critical' | 'warning' | 'unusual' | 'info';

export interface DcAlert {
  id: number;
  severity: AlertSeverity;
  text: string;
  device: string;
  time: number; // epoch ms
}

export interface GaugeVm {
  id: string;
  ar: string;
  icon: string;
  pct: number;
  valueText: string;
  color: string;
}

export interface HealthRow {
  name: string;
  valueText: string;
  color: string;
}

export interface HealthCategory {
  key: SensorKind;
  ar: string;
  icon: string;
  rows: HealthRow[];
}

export interface GroupHealth {
  name: string;
  total: number;
  counts: Record<PrtgStatus, number>;
}
