import { Injectable, computed, signal } from '@angular/core';

export type Tone = 'ok' | 'warn' | 'bad' | 'info';
export type MuniType = 'lighting' | 'water' | 'roads' | 'sanitation' | 'video';
export type MuniPriority = 'critical' | 'high' | 'medium';
export type MuniStatus = 'open' | 'delayed' | 'review';
export type MuniLayerId = MuniType;
export type DistrictKey = 'central' | 'quba' | 'awali' | 'sultana' | 'harra' | 'hijrah' | 'airport';

export interface Incident {
  uid: string;
  title: string;
  district: DistrictKey;
  districtLabel: string;
  type: MuniType;
  priority: MuniPriority;
  priorityLabel: string;
  status: MuniStatus;
  ageHours: number;
  source: string;
  asset: string;
  wo: string;
  cross: string;
  sla: string;
  notes: string;
  ll: [number, number];
}

export const DISTRICTS: { key: DistrictKey; ar: string; ll: [number, number] }[] = [
  { key: 'central', ar: 'المنطقة المركزية (محيط الحرم)', ll: [24.4672, 39.6112] },
  { key: 'quba', ar: 'حي قباء', ll: [24.4390, 39.6170] },
  { key: 'awali', ar: 'حي العوالي', ll: [24.4300, 39.6420] },
  { key: 'sultana', ar: 'حي سلطانة', ll: [24.4950, 39.5900] },
  { key: 'harra', ar: 'الحرة الشرقية', ll: [24.4750, 39.6600] },
  { key: 'hijrah', ar: 'طريق الهجرة', ll: [24.4350, 39.5650] },
  { key: 'airport', ar: 'نطاق المطار', ll: [24.5534, 39.7051] },
];

export const TYPE_META: Record<MuniType, { ar: string; color: string; icon: string }> = {
  lighting: { ar: 'الإنارة الذكية', color: '#f59e0b', icon: 'lightbulb' },
  water: { ar: 'المياه والتصريف', color: '#0ea5e9', icon: 'water_drop' },
  roads: { ar: 'الطرق والحفريات', color: '#f97316', icon: 'construction' },
  sanitation: { ar: 'النظافة والحاويات', color: '#10b981', icon: 'delete' },
  video: { ar: 'تحليل الفيديو', color: '#0891b2', icon: 'videocam' },
};

const BASE_INCIDENTS: Incident[] = [
  { uid: 'MUN-2026-8841', title: 'تجمع مياه وكسر خط فرعي — حي قباء', district: 'quba', districtLabel: 'حي قباء', type: 'water', priority: 'critical', priorityLabel: 'حرجة', status: 'open', ageHours: 5, source: 'بلاغ 940 + شركة المياه الوطنية (NWC)', asset: 'WTR-QB-19', wo: 'WO-4102 (طوارئ المياه)', cross: 'مرتبط مع لوحة المرور (إغلاق حارة)', sla: 'متبقي 18د', notes: 'تم توجيه صهريج الشفط وفرقة الصيانة مع تأمين المسار بالتنسيق مع المرور.', ll: [24.4410, 39.6190] },
  { uid: 'MUN-2026-8842', title: 'عطل مجموعة إنارة ذكية (فشل تغذية)', district: 'sultana', districtLabel: 'حي سلطانة', type: 'lighting', priority: 'high', priorityLabel: 'عالية', status: 'delayed', ageHours: 20, source: 'نظام رسيل للإنارة الذكية', asset: 'LGT-SL-408', wo: 'WO-4089 (مقاول الإنارة)', cross: 'تنبيه سلامة مرورية ليلي', sla: 'متأخر 25د', notes: 'انقطاع تغذية عن 14 عمود إنارة على تقاطع سلطانة.', ll: [24.4960, 39.5880] },
  { uid: 'MUN-2026-8843', title: 'حفريات وتأخر إعادة تأهيل طبقة الأسفلت', district: 'central', districtLabel: 'المنطقة المركزية', type: 'roads', priority: 'high', priorityLabel: 'عالية', status: 'delayed', ageHours: 100, source: 'منصة نسق / بلدي + تفتيش الأمانة', asset: 'RD-CN-112', wo: 'WO-3994 (مكتب تنسيق المشاريع)', cross: 'مرتبط مع لوحة المرور (تحويلة جزئية)', sla: 'متأخر يومين', notes: 'تجاوز مدة التصريح المعتمدة لإعادة السفلتة قرب الدائري الأول.', ll: [24.4620, 39.6180] },
  { uid: 'MUN-2026-8844', title: 'عائق رصيف وسقوط لوحة إرشادية', district: 'hijrah', districtLabel: 'طريق الهجرة', type: 'roads', priority: 'critical', priorityLabel: 'حرجة', status: 'open', ageHours: 3, source: 'بلاغات 940 + الفرق الميدانية', asset: 'SGN-HJ-074', wo: 'WO-4110 (صيانة الطرق)', cross: 'مرتبط مع الأمن العام والمرور', sla: 'متبقي 12د', notes: 'إزالة العائق جارية لضمان عدم نزول المشاة لنهر الطريق.', ll: [24.4380, 39.5700] },
  { uid: 'MUN-2026-8845', title: 'تجاوز حد امتلاء الحاويات الذكية (92%)', district: 'central', districtLabel: 'المنطقة المركزية', type: 'sanitation', priority: 'medium', priorityLabel: 'متوسطة', status: 'open', ageHours: 4, source: 'حساسات الحاويات + خطة النظافة', asset: 'BIN-CN-305', wo: 'WO-4115 (مقاول النظافة المركزية)', cross: 'تنسيق دخول خارج ذروة الصلاة', sla: 'متبقي 30د', notes: 'تم جدولة التفريغ الفوري قبل صلاة العشاء.', ll: [24.4700, 39.6050] },
  { uid: 'MUN-2026-8846', title: 'رصد جسم متروك / مخلفات محتملة (VISuite)', district: 'central', districtLabel: 'المنطقة المركزية', type: 'video', priority: 'medium', priorityLabel: 'متوسطة', status: 'review', ageHours: 2, source: 'Ipsotek VISuite (قيد المراجعة)', asset: 'CAM-CN-092', wo: 'بانتظار الاعتماد قبل إنشاء أمر عمل', cross: 'تحقق بصري مشترك', sla: 'قيد المراجعة', notes: 'تنبيه آلي يحتاج مراجعة المشغل لتصنيفه كمخلفات وتوجيه النظافة.', ll: [24.4740, 39.6140] },
];

@Injectable({ providedIn: 'root' })
export class MunicipalityCommandStore {
  readonly layers = signal<Record<MuniLayerId, boolean>>({ lighting: true, water: true, roads: true, sanitation: true, video: true });
  readonly selectedUid = signal('MUN-2026-8841');
  readonly traceUid = signal<string | null>(null);
  readonly govOpen = signal(false);
  readonly toast = signal<string | null>(null);
  readonly verified = signal<Set<string>>(new Set());

  private readonly lightFaults = signal(142);
  private readonly lightNoData = signal(38);
  private readonly crit940 = signal(24);
  private readonly late940 = signal(19);
  private readonly woOpen = signal(312);
  private readonly woLate = signal(27);
  private readonly sanPct = signal(91.5);
  private readonly fullBins = signal(18);
  private readonly waterActive = signal(6);
  private readonly pumpsOn = signal(47);
  private readonly roadHazards = signal(34);

  readonly incidents = computed(() => BASE_INCIDENTS);

  readonly filtered = this.incidents;

  readonly selected = computed(() => this.incidents().find((i) => i.uid === this.selectedUid()) ?? this.incidents()[0]);
  readonly trace = computed(() => this.incidents().find((i) => i.uid === this.traceUid()) ?? null);

  readonly kpi = computed(() => {
    return {
      lightPct: 96.8,
      lightFaults: this.lightFaults(),
      lightNoData: this.lightNoData(),
      crit940: this.crit940(),
      late940: this.late940(),
      woOpen: this.woOpen(),
      woLate: this.woLate(),
      sanPct: this.sanPct(),
      fullBins: this.fullBins(),
      waterActive: this.waterActive(),
      pumpsOn: this.pumpsOn(),
      roadHazards: this.roadHazards(),
      readiness: '94%',
    };
  });

  constructor() {
    setInterval(() => this.drift(), 8000);
  }

  private drift(): void {
    const walk = (v: number, step: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v + Math.round((Math.random() - 0.5) * 2 * step)));
    this.lightFaults.update((v) => walk(v, 3, 130, 156));
    this.lightNoData.update((v) => walk(v, 2, 30, 46));
    this.crit940.update((v) => walk(v, 1, 20, 28));
    this.late940.update((v) => walk(v, 1, 15, 23));
    this.woOpen.update((v) => walk(v, 3, 296, 330));
    this.woLate.update((v) => walk(v, 1, 22, 32));
    this.sanPct.update((v) => Math.min(95, Math.max(88, +(v + (Math.random() - 0.5) * 0.6).toFixed(1))));
    this.fullBins.update((v) => walk(v, 2, 12, 24));
    if (Math.random() < 0.25) this.waterActive.update((v) => walk(v, 1, 4, 8));
    if (Math.random() < 0.2) this.roadHazards.update((v) => walk(v, 1, 30, 38));
  }

  toggleLayer(id: MuniLayerId): void {
    this.layers.update((l) => ({ ...l, [id]: !l[id] }));
  }

  verifyTrace(): void {
    const uid = this.traceUid();
    if (uid) this.verified.update((s) => new Set(s).add(uid));
    this.traceUid.set(null);
    this.showToast('تم اعتماد التحقق الميداني وتحديث حالة أمر العمل في CMMS');
  }

  private toastTimer?: ReturnType<typeof setTimeout>;

  showToast(msg: string): void {
    this.toast.set(msg);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3500);
  }
}
