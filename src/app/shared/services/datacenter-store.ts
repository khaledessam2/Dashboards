import { Injectable, computed, signal } from '@angular/core';
import {
  NETWORK_CAPACITY_MBIT,
  RAM_CEILING_GB,
  SENSOR_AR,
  STATUS_ORDER,
  cpuColor,
  loadColor,
  pingColor,
  tempColor,
  trafficColor,
} from '../constants/datacenter.constants';
import {
  AlertSeverity, DcAlert, Device, FailingDevice, GaugeVm, GroupHealth, HealthCategory, OpenOutage, PrtgStatus,
  Sensor, SensorKind, ServiceCheck, StaleSensor,
} from '../models/datacenter.model';

const DOWN_MESSAGE: Record<SensorKind, string> = {
  ping: 'لا يوجد رد على الطلب (Timeout)',
  cpu: 'تعذّرت قراءة حمل المعالج',
  memory: 'تعذّرت قراءة الذاكرة',
  disk: 'خطأ في الوصول إلى القرص',
  traffic: 'الواجهة متوقفة عن الإرسال',
  temperature: 'فُقدت قراءة الحرارة',
};

/** Mock: stale sensors (sensor id, scan interval in seconds). */
const STALE_MOCK: Array<[number, number]> = [[5, 60], [14, 300], [29, 60], [61, 300]];

/** Mock: Down transitions per device over 7 / 30 days (real source: PRTG messages). */
const FAILING_MOCK: FailingDevice[] = [
  { name: 'مسجل الكاميرات 02', d7: 9, d30: 31 },
  { name: 'مفتاح الطابق الثاني', d7: 6, d30: 24 },
  { name: 'خادم البث', d7: 5, d30: 17 },
  { name: 'وحدة التبريد 02', d7: 3, d30: 14 },
  { name: 'موجه الفرع', d7: 2, d30: 9 },
];

/** Mock service probes — real checks run outside the backend (open item: probe host). */
function buildServiceChecks(now: number): ServiceCheck[] {
  const sec = (min: number, max: number) => `${Math.round(rand(min, max))} ث`;
  const ms = (min: number, max: number) => `${Math.round(rand(min, max))} ms`;
  const at = () => now - rand(2_000, 12_000);
  return [
    { id: 'svc-prtg', ar: 'مُجمِّع PRTG', icon: 'sync', status: 'healthy', verifiedAt: at(),
      metrics: [{ label: 'آخر جمع ناجح', value: `قبل ${sec(5, 25)}` }, { label: 'زمن الاستجابة', value: ms(180, 420) }, { label: 'إخفاقات متتالية', value: '0' }] },
    { id: 'svc-rest', ar: 'واجهة REST الحية', icon: 'api', status: 'healthy', verifiedAt: at(),
      metrics: [{ label: 'اختبار Snapshot', value: 'ناجح' }, { label: 'زمن الاستجابة', value: ms(40, 140) }, { label: 'معدل الفشل', value: '0.2%' }] },
    { id: 'svc-cache', ar: 'الذاكرة المؤقتة الحية', icon: 'memory', status: 'healthy', verifiedAt: at(),
      metrics: [{ label: 'آخر تحديث ناجح', value: `قبل ${sec(3, 20)}` }, { label: 'عمر الـ Snapshot', value: sec(3, 20) }] },
    { id: 'svc-sse', ar: 'قناة SSE', icon: 'podcasts', status: 'healthy', verifiedAt: at(),
      metrics: [{ label: 'حالة الاتصال', value: 'متصلة' }, { label: 'رسالة الاختبار', value: 'تم التسليم' }] },
    { id: 'svc-history', ar: 'الواجهة التاريخية وقاعدة NoSQL', icon: 'database', status: 'healthy', verifiedAt: at(),
      metrics: [{ label: 'اختبار القراءة', value: 'ناجح' }, { label: 'زمن الاستجابة', value: ms(60, 210) }, { label: 'آخر كتابة ناجحة', value: `قبل ${sec(10, 40)}` }] },
    { id: 'svc-rabbit', ar: 'طابور RabbitMQ لإعادة المحاولة', icon: 'swap_horiz', status: 'degraded', verifiedAt: at(),
      metrics: [{ label: 'سجلات معلّقة', value: `${Math.round(rand(110, 160))}` }, { label: 'عمر أقدم سجل', value: `${Math.round(rand(4, 9))} د` }, { label: 'DB Writer', value: 'يعمل ببطء' }] },
  ];
}

const ALERTS_SIZE = 12; // §4.8
const DEVICES_SIZE = 40; // §4.9
const FRESH_MS = 8_000;

/** 12 groups, 35 devices (Arabic names only — §4.9). */
const GROUPS = ['الخوادم', 'مفاتيح الشبكة', 'جدران الحماية', 'التخزين', 'مسجلات الكاميرات', 'تحليل الفيديو', 'قواعد البيانات', 'الاتصالات', 'الطاقة والتبريد', 'الجدار المرئي', 'الموجهات', 'النسخ الاحتياطي'];

const DEVICES: Array<[string, number]> = [
  ['خادم التطبيقات 01', 0], ['خادم التطبيقات 02', 0], ['خادم الملفات', 0], ['خادم الويب', 0],
  ['مفتاح الشبكة الرئيسي', 1], ['مفتاح الطابق الأول', 1], ['مفتاح الطابق الثاني', 1], ['مفتاح مركز البيانات', 1],
  ['جدار الحماية الرئيسي', 2], ['جدار الحماية الاحتياطي', 2], ['جدار حماية الويب', 2],
  ['وحدة التخزين الرئيسية', 3], ['وحدة التخزين الاحتياطية', 3], ['تخزين الفيديو', 3],
  ['مسجل الكاميرات 01', 4], ['مسجل الكاميرات 02', 4], ['مسجل الكاميرات 03', 4],
  ['خادم تحليل الفيديو 01', 5], ['خادم تحليل الفيديو 02', 5], ['خادم البث', 5],
  ['قاعدة البيانات الرئيسية', 6], ['قاعدة البيانات الاحتياطية', 6], ['خادم البحث والفهرسة', 6],
  ['بوابة الاتصالات', 7], ['سنترال IP', 7], ['مودم الاتصال الاحتياطي', 7],
  ['وحدة UPS الرئيسية', 8], ['وحدة التبريد 01', 8], ['وحدة التبريد 02', 8],
  ['شاشة الجدار المرئي 01', 9], ['شاشة الجدار المرئي 02', 9],
  ['موجه الإنترنت الرئيسي', 10], ['موجه الفرع', 10],
  ['خادم النسخ الاحتياطي', 11], ['خادم المزامنة DR', 11],
];

/** Which devices carry which sensors: ping on all (35) + 18 + 10 + 10 + 12 + 8 = 93 sensors. */
const SENSOR_DEVICES: Record<Exclude<SensorKind, 'ping'>, number[]> = {
  cpu: Array.from({ length: 18 }, (_, i) => i * 2),
  memory: [0, 1, 2, 3, 17, 18, 20, 21, 22, 34],
  disk: [0, 1, 2, 11, 12, 13, 20, 21, 22, 33],
  traffic: [4, 5, 6, 7, 8, 9, 10, 23, 24, 25, 31, 32],
  temperature: [14, 15, 16, 26, 27, 28, 29, 30],
};

/** Fixed sensor indexes that are not "up", so the wall always has something to show. */
const SENSOR_STATUS_AT: Record<number, PrtgStatus> = {
  7: 'down', 52: 'down',
  3: 'warning', 21: 'warning', 40: 'warning', 66: 'warning', 80: 'warning',
  12: 'unusual', 33: 'unusual', 71: 'unusual',
  58: 'paused', 90: 'paused',
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const sameSet = (a: Set<unknown>, b: Set<unknown>) => a.size === b.size && [...a].every((x) => b.has(x));

function initialValue(kind: SensorKind): number {
  switch (kind) {
    case 'ping': return rand(1, 26);
    case 'cpu': return rand(8, 88);
    case 'memory': return rand(0.9, 3.4);
    case 'disk': return rand(30, 86);
    case 'traffic': return rand(2, 190);
    case 'temperature': return rand(28, 54);
  }
}

const RANGE: Record<SensorKind, [number, number]> = {
  ping: [1, 40], cpu: [3, 98], memory: [0.5, 3.9], disk: [20, 95], traffic: [1, 240], temperature: [24, 60],
};

function pickSeverity(): AlertSeverity {
  const r = Math.random();
  return r < 0.1 ? 'critical' : r < 0.4 ? 'warning' : r < 0.6 ? 'unusual' : 'info';
}

function alertText(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical': return 'الجهاز متوقف عن الاستجابة';
    case 'warning': return 'ارتفاع في الحمل يتجاوز الحد المسموح';
    case 'unusual': return 'قراءة غير معتادة على الحساس';
    case 'info': return 'عاد الجهاز للعمل بشكل طبيعي';
  }
}

@Injectable({ providedIn: 'root' })
export class DatacenterStore {
  private nextAlertId = 1;

  /** Ticks every second (header clock). */
  readonly now = signal(Date.now());
  readonly lastUpdate = signal(Date.now());

  private readonly sensors = signal<Sensor[]>(this.buildSensors());
  readonly alerts = signal<DcAlert[]>([]);

  /** Device status = worst status among its sensors. */
  readonly devices = computed<Device[]>(() => {
    const worst = new Map<number, PrtgStatus[]>();
    for (const s of this.sensors()) worst.set(s.deviceId, [...(worst.get(s.deviceId) ?? []), s.status]);
    return DEVICES.map(([name, g], id) => {
      const statuses = worst.get(id) ?? [];
      const status: PrtgStatus = statuses.includes('down')
        ? 'down'
        : statuses.includes('warning')
          ? 'warning'
          : statuses.includes('unusual')
            ? 'unusual'
            : statuses.length && statuses.every((s) => s === 'paused')
              ? 'paused'
              : 'up';
      return { id, name, group: GROUPS[g], ip: `10.0.13.${10 + id}`, status };
    });
  });

  /** §4.2 KPI cards. */
  readonly kpis = computed(() => {
    const s = this.sensors();
    return {
      systems: DEVICES.length,
      sensors: s.length,
      down: s.filter((x) => x.status === 'down').length,
      warn: s.filter((x) => x.status === 'warning' || x.status === 'unusual').length,
    };
  });

  private byKind(kind: SensorKind): Sensor[] {
    return this.sensors().filter((s) => s.kind === kind && s.status !== 'down' && s.status !== 'paused');
  }

  /** §4.1 infrastructure gauges. */
  readonly gauges = computed<GaugeVm[]>(() => {
    const cpu = avg(this.byKind('cpu').map((s) => s.value));
    const ramPct = (avg(this.byKind('memory').map((s) => s.value)) / RAM_CEILING_GB) * 100;
    const disk = avg(this.byKind('disk').map((s) => s.value));
    const mbit = this.byKind('traffic').reduce((a, s) => a + s.value, 0);
    const netPct = (mbit / NETWORK_CAPACITY_MBIT) * 100;
    return [
      { id: 'g-cpu', ar: 'المعالج', icon: 'memory', pct: clamp(cpu, 0, 100), valueText: `${cpu.toFixed(0)}%`, color: loadColor(cpu) },
      { id: 'g-ram', ar: 'الذاكرة', icon: 'developer_board', pct: clamp(ramPct, 0, 100), valueText: `${ramPct.toFixed(0)}%`, color: loadColor(ramPct) },
      { id: 'g-storage', ar: 'التخزين', icon: 'hard_drive', pct: clamp(disk, 0, 100), valueText: `${disk.toFixed(0)}%`, color: loadColor(disk) },
      { id: 'g-network', ar: 'الشبكة', icon: 'lan', pct: clamp(netPct, 0, 100), valueText: `${mbit.toFixed(0)} Mbit/s`, color: loadColor(netPct) },
    ];
  });

  private nameOf(deviceId: number): string {
    return DEVICES[deviceId][0];
  }

  /** §4.5 top 8 interfaces by bandwidth. */
  readonly netLoad = computed(() =>
    this.sensors()
      .filter((s) => s.kind === 'traffic' && s.status !== 'down' && s.status !== 'paused')
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
      .map((s) => ({ id: s.id, name: this.nameOf(s.deviceId), value: s.value, color: trafficColor(s.value) })),
  );

  /** §4.6 top 3 worst per category (ping / cpu / temperature). */
  readonly deviceHealth = computed<HealthCategory[]>(() => {
    const worst = (kind: SensorKind, color: (v: number) => string, fmt: (v: number) => string) =>
      this.sensors()
        .filter((s) => s.kind === kind && s.status !== 'down' && s.status !== 'paused')
        .sort((a, b) => b.value - a.value)
        .slice(0, 3)
        .map((s) => ({ name: this.nameOf(s.deviceId), valueText: fmt(s.value), color: color(s.value) }));
    return [
      { key: 'ping', ar: SENSOR_AR.ping, icon: 'network_ping', rows: worst('ping', pingColor, (v) => `${v.toFixed(0)} ms`) },
      { key: 'cpu', ar: SENSOR_AR.cpu, icon: 'memory', rows: worst('cpu', cpuColor, (v) => `${v.toFixed(0)}%`) },
      { key: 'temperature', ar: SENSOR_AR.temperature, icon: 'device_thermostat', rows: worst('temperature', tempColor, (v) => `${v.toFixed(0)}°C`) },
    ];
  });

  /** §4.9 devices list, worst first, max 40. */
  readonly deviceList = computed(() =>
    [...this.devices()].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)).slice(0, DEVICES_SIZE),
  );

  /** §4.10 sensor status donut. */
  readonly statusCounts = computed(() => {
    const counts: Record<PrtgStatus, number> = { up: 0, down: 0, warning: 0, unusual: 0, paused: 0 };
    for (const s of this.sensors()) counts[s.status]++;
    return counts;
  });

  /** §4.11 group health bars (sensor status per device group). */
  readonly groupHealth = computed<GroupHealth[]>(() => {
    const deviceGroup = new Map(DEVICES.map(([, g], id) => [id, GROUPS[g]]));
    const rows = new Map<string, GroupHealth>(GROUPS.map((name) => [name, { name, total: 0, counts: { up: 0, down: 0, warning: 0, unusual: 0, paused: 0 } }]));
    for (const s of this.sensors()) {
      const row = rows.get(deviceGroup.get(s.deviceId)!)!;
      row.total++;
      row.counts[s.status]++;
    }
    return [...rows.values()].filter((r) => r.total > 0);
  });

  private readonly downSince = new Map<number, number>();
  private readonly staleSince = new Map<number, { lastCheck: number; interval: number }>();

  /** Open outages, longest first. */
  readonly openOutages = computed<OpenOutage[]>(() => {
    const now = this.now();
    return this.sensors()
      .filter((s) => s.status === 'down')
      .map((s) => ({
        id: s.id,
        device: this.nameOf(s.deviceId),
        sensor: SENSOR_AR[s.kind],
        message: DOWN_MESSAGE[s.kind],
        downMs: now - (this.downSince.get(s.id) ?? now),
      }))
      .sort((a, b) => b.downMs - a.downMs);
  });

  /** Sensors whose last reading is older than their scan interval; paused sensors are excluded. */
  readonly staleSensors = computed<StaleSensor[]>(() => {
    const now = this.now();
    const byId = new Map(this.sensors().map((s) => [s.id, s]));
    return [...this.staleSince]
      .map(([id, v]) => ({ s: byId.get(id)!, v }))
      .filter(({ s }) => s.status !== 'paused')
      .map(({ s, v }) => ({ id: s.id, device: this.nameOf(s.deviceId), sensor: SENSOR_AR[s.kind], overdueMs: now - v.lastCheck - v.interval * 1000 }))
      .filter((x) => x.overdueMs > 0)
      .sort((a, b) => b.overdueMs - a.overdueMs);
  });

  readonly failingDevices = signal<FailingDevice[]>(FAILING_MOCK);

  /** Service health (probes run outside the backend). */
  readonly serviceChecks = signal<ServiceCheck[]>(buildServiceChecks(Date.now()));

  /** New alerts blink; critical ones blink red. */
  readonly freshAlertIds = computed(() => new Set(this.alerts().filter((a) => this.now() - a.time < FRESH_MS).map((a) => a.id)), { equal: sameSet });

  /** PRTG connection indicator (#prtg-dot / #prtg-label) — mock is always live. */
  readonly prtgOnline = signal(true);

  constructor() {
    const now = Date.now();
    this.alerts.set(Array.from({ length: ALERTS_SIZE }, (_, i) => this.makeAlert(now - (i + 1) * rand(60_000, 300_000))).sort((a, b) => b.time - a.time));

    for (const s of this.sensors()) if (s.status === 'down') this.downSince.set(s.id, now - rand(10 * 60_000, 9 * 3_600_000));
    for (const [id, interval] of STALE_MOCK) this.staleSince.set(id, { lastCheck: now - interval * 1000 * rand(2.5, 6), interval });

    setInterval(() => this.now.set(Date.now()), 1000);
    setInterval(() => {
      this.serviceChecks.set(buildServiceChecks(Date.now()));
      this.lastUpdate.set(Date.now());
    }, 15_000);
    setInterval(() => {
      this.pushAlert();
      this.lastUpdate.set(Date.now());
    }, 15_000); // fast cycle
    setInterval(() => {
      this.drift();
      this.lastUpdate.set(Date.now());
    }, 30_000); // full cycle
  }

  private buildSensors(): Sensor[] {
    const list: Sensor[] = [];
    const add = (deviceId: number, kind: SensorKind) => {
      const id = list.length;
      const status = SENSOR_STATUS_AT[id] ?? 'up';
      list.push({ id, deviceId, kind, status, value: status === 'down' ? 0 : initialValue(kind) });
    };
    DEVICES.forEach((_, id) => add(id, 'ping'));
    (Object.keys(SENSOR_DEVICES) as Array<keyof typeof SENSOR_DEVICES>).forEach((kind) => SENSOR_DEVICES[kind].forEach((id) => add(id, kind)));
    return list;
  }

  private makeAlert(time: number, severity = pickSeverity()): DcAlert {
    const sensors = this.sensors();
    const device = this.nameOf(sensors[Math.floor(Math.random() * sensors.length)].deviceId);
    return { id: this.nextAlertId++, severity, text: alertText(severity), device, time };
  }

  private pushAlert(): void {
    this.alerts.update((list) => [this.makeAlert(Date.now()), ...list].slice(0, ALERTS_SIZE));
  }

  private drift(): void {
    this.sensors.update((list) =>
      list.map((s) => {
        if (s.status === 'down' || s.status === 'paused') return s;
        const [min, max] = RANGE[s.kind];
        return { ...s, value: clamp(s.value * (1 + (Math.random() - 0.5) * 0.12), min, max) };
      }),
    );
  }
}

