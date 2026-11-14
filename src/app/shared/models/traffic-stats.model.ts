export interface FlowStats {
  entry: number;
  exit: number
}

export interface ZoneStat {
  ar: string;
  value: number
}

export interface HourBucket {
  label: string;
  count: number
}

export interface CameraSeries {
  name: string;
  total: number;
  data: number[];
}
