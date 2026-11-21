import { Injectable, computed, signal } from '@angular/core';

export type Tone = 'ok' | 'warn' | 'bad' | 'info';
export type LayerId = 'hazards' | 'closures' | 'parking' | 'cameras';

export interface MapItem {
  type: string;
  title: string;
  badge: string;
  tone: Tone;
  m1Label: string;
  m1Val: string;
  m1Tone: Tone;
  m2Label: string;
  m2Val: string;
  cam: string;
}

const item = (type: string, title: string, badge: string, tone: Tone, m1: [string, string, Tone], m2: [string, string], cam: string): MapItem => ({
  type, title, badge, tone, m1Label: m1[0], m1Val: m1[1], m1Tone: m1[2], m2Label: m2[0], m2Val: m2[1], cam,
});

export const MAP_ITEMS: Record<string, MapItem> = {
  central_area: item('المنطقة المركزية', 'المسجد النبوي الشريف ومحيطه', 'كثافة عالية', 'warn', ['صافي التدفق', '+3,410 مركبة', 'warn'], ['مواقف المنطقة', '96% إشغال'], 'كاميرا الساحة الشمالية - المسجد النبوي'),
  airport_hub: item('مركز نقل جوي', 'مطار الأمير محمد بن عبدالعزيز', 'موجة وصول', 'info', ['رحلات الساعة القادمة', '14 رحلة', 'info'], ['المسافرون المتوقعون', '4,150 مسافر'], 'كاميرا صالة الوصول - المطار'),
  train_hub: item('مركز نقل سككي', 'محطة قطار الحرمين', 'انتظام جيد', 'ok', ['قطارات الساعة القادمة', '4 قطارات', 'ok'], ['المسافرون المتوقعون', '2,300 مسافر'], 'كاميرا محطة قطار الحرمين - الرصيف'),
  closure_vip: item('إغلاق رسمي', 'مسار زيارة رسمية - طريق الملك عبدالعزيز', 'إغلاق 17:30', 'info', ['التأثير', 'تحويل مسارين', 'info'], ['الجهة', 'الأمن العام'], 'كاميرا تقاطع الملك عبدالعزيز'),
  roadwork_1: item('حفريات بلدية', 'تصريح حفر #NSQ-882 - طريق سلطانة', 'جزئي', 'warn', ['المدة المتبقية', '3 أيام', 'warn'], ['الجهة', 'أمانة المدينة'], 'كاميرا طريق سلطانة'),
  park_central: item('مواقف سيارات', 'مواقف المنطقة المركزية تحت الأرض', 'شبه ممتلئ 96%', 'bad', ['الأماكن المتبقية', '180 موقف', 'bad'], ['طابور المدخل', '32 مركبة'], 'مدخل مواقف المنطقة المركزية - بوابة 3'),
  park_shuhada: item('مواقف ونقل ترددي', 'مواقف سيد الشهداء (Park & Ride)', 'متاح 62%', 'ok', ['الأماكن المتبقية', '1,420 موقف', 'ok'], ['وصول الحافلة', 'كل 3 دقائق'], 'محطة حافلات سيد الشهداء'),
  park_aliyah: item('مواقف ونقل ترددي', 'مواقف العالية (Park & Ride)', 'إشغال 78%', 'warn', ['الأماكن المتبقية', '640 موقف', 'warn'], ['وصول الحافلة', 'كل 5 دقائق'], 'محطة حافلات العالية'),
  acc_911: item('حادث مروري مؤكد (911)', 'تصادم مركبتين - الدائري الأول', 'متأخر SLA', 'bad', ['المسار المتأثر', 'الحارة اليمنى', 'warn'], ['الجهة المستجيبة', 'مرور المدينة'], 'كاميرا الدائري الأول - تقاطع قباء'),
  hazard_water: item('مخاطر بلدية ومياه (NWC)', 'تسرب مياه وتجمع - طريق السلام', 'فرقة بالموقع', 'info', ['تأثير الطريق', 'إغلاق مسار أيمن', 'info'], ['الجهة المالكة', 'شركة المياه الوطنية'], 'كاميرا طريق السلام الغربي'),
alert_wrongway: item('تنبيه كاميرا (VISuite)', 'رصد عكس اتجاه - مخرج نفق المناخة', 'أولوية عالية', 'bad', ['منذ', '35 ثانية', 'bad'], ['الحالة', 'بانتظار التحقق'], 'مخرج نفق المناخة - عكس اتجاه'),  alert_parking: item('تنبيه كاميرا (VISuite)', 'وقوف مخالف يعيق مسار حافلات', 'بانتظار التحقق', 'warn', ['منذ', '1 دقيقة', 'warn'], ['القاعدة', 'VISuite Rule #14'], 'طريق الملك عبدالعزيز - وقوف مخالف'),  cong_quba: item('ازدحام حرج', 'جادة قباء - مدخل الدائري الأول', 'ازدحام حرج', 'bad', ['متوسط السرعة', '22 km/h', 'bad'], ['نسبة السعة (V/C)', '91%'], 'كاميرا جادة قباء - مدخل الدائري الأول'),  cong_ring1: item('ازدحام كثيف', 'الدائري الأول - تقاطع السلام', 'ازدحام كثيف', 'bad', ['متوسط السرعة', '24 km/h', 'bad'], ['نسبة السعة (V/C)', '92%'], 'كاميرا الدائري الأول - تقاطع السلام'),
};


@Injectable({ providedIn: 'root' })
export class TrafficCommandStore {
  readonly selectedKey = signal('acc_911');
  readonly selected = computed(() => MAP_ITEMS[this.selectedKey()] ?? MAP_ITEMS['acc_911']);
  readonly layers = signal<Record<LayerId, boolean>>({ hazards: true, closures: true, parking: true, cameras: false });

  readonly cameraModal = signal<string | null>(null);
  readonly govOpen = signal(false);
  readonly toast = signal<string | null>(null);
  readonly incidentHandled = signal(false);

  private readonly vehicles = signal(48920);
  private readonly inbound = signal(14850);
  private readonly outbound = signal(11440);
  private readonly zones = signal(4);
  private readonly open = signal(7);
  private readonly sla = signal(2);
  private readonly corrTimes = signal([23, 14, 19]);
  private readonly parkPct = signal([96, 62, 78]);
  private readonly queue = signal(32);
  private readonly resp = signal({ assign: 38, arrive: 4.6, clear: 14.2 });
  readonly flowSeries = signal([9800, 11200, 12900, 13800, 14850]);

  readonly data = computed(() => {
    const v = this.vehicles();
    const pct = ((v / 45130 - 1) * 100).toFixed(1);
    return {
      vehicles: v, delta: pct + '% مقارنة بالمتوسط', net: this.inbound() - this.outbound(), inbound: this.inbound(), outbound: this.outbound(),
      zones: this.zones(), km: (this.zones() * 4.6).toFixed(1), open: this.open(), sla: this.sla(),
    };
  });

  readonly corridors = computed(() => {
    const t = this.corrTimes();
    const defs = [
      { name: 'مطار الأمير محمد ← الحرم النبوي', ref: 16, base: 72, note: 'تأخير على طريق المطار', okNote: 'حركة انسيابية على طريق المطار' },
      { name: 'محطة قطار الحرمين ← الحرم النبوي', ref: 12, base: 45, note: 'تأخير على طريق قطار الحرمين', okNote: 'حركة انسيابية (مسار النقل الترددي نشط)' },
      { name: 'محور قباء ← المنطقة المركزية', ref: 9, base: 88, note: 'تأخير - ازدحام عند مدخل الدائري الأول', okNote: 'حركة انسيابية على محور قباء' },
    ];
    return defs.map((d, i) => {
      const delay = t[i] - d.ref;
      const tone: Tone = delay >= 9 ? 'bad' : delay >= 4 ? 'warn' : 'ok';
      const baseTime = [23, 14, 19][i];
      return { name: d.name, time: t[i] + ' د', ref: 'المرجع ' + d.ref + 'د', pct: Math.min(100, Math.max(15, d.base + (t[i] - baseTime) * 3)), tone, note: tone === 'ok' ? d.okNote : '+' + delay + ' دقائق ' + d.note };
    });
  });

  readonly parking = computed(() => {
    const p = this.parkPct();
    const defs = [
      { name: 'مواقف المنطقة المركزية', cap: 4500 },
      { name: 'مواقف سيد الشهداء (ترددي)', cap: 3737 },
      { name: 'مواقف العالية (ترددي)', cap: 2909 },
    ];
    const notes = ['طابور ' + this.queue() + ' مركبة عند المدخل', 'وصول الحافلة: 3 دقائق', 'وصول الحافلة: 5 دقائق'];
    return defs.map((d, i) => ({
      name: d.name, pct: p[i], left: Math.round(d.cap * (1 - p[i] / 100)).toLocaleString('en-US') + ' موقف', note: notes[i],
      noteTone: i === 0 ? 'text-[#e11d48] font-bold' : 'text-[#0b5cff]', tone: (p[i] >= 90 ? 'bad' : p[i] >= 75 ? 'warn' : 'ok') as Tone,
    }));
  });

  readonly response = computed(() => {
    const r = this.resp();
    return [
      { label: 'زمن الإسناد', val: String(r.assign), unit: 'ثانية' },
      { label: 'زمن الوصول', val: r.arrive.toFixed(1), unit: 'دقيقة' },
      { label: 'إخلاء الطريق', val: r.clear.toFixed(1), unit: 'دقيقة' },
    ];
  });

  constructor() {
    setInterval(() => this.drift(), 8000);
  }

  private drift(): void {
    const walk = (v: number, step: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v + Math.round((Math.random() - 0.5) * 2 * step)));
    this.vehicles.update((v) => walk(v, 320, 44000, 54000));
    this.inbound.update((v) => walk(v, 160, 13500, 16500));
    this.outbound.update((v) => walk(v, 140, 10500, 12800));
    this.flowSeries.update((s) => [...s.slice(0, -1), this.inbound()]);
    if (Math.random() < 0.3) this.zones.update((v) => walk(v, 1, 3, 6));
    if (Math.random() < 0.25) this.open.update((v) => walk(v, 1, 5, 9));
    if (Math.random() < 0.2) this.sla.update((v) => walk(v, 1, 1, 4));
    this.corrTimes.update((t) => [walk(t[0], 1, 18, 27), walk(t[1], 1, 12, 17), walk(t[2], 2, 12, 24)]);
    this.parkPct.update((p) => [walk(p[0], 1, 90, 99), walk(p[1], 1, 55, 70), walk(p[2], 1, 72, 85)]);
    this.queue.update((q) => walk(q, 4, 18, 46));
    this.resp.update((r) => ({ assign: walk(r.assign, 2, 30, 48), arrive: Math.round(Math.min(6, Math.max(3.8, r.arrive + (Math.random() - 0.5) * 0.4)) * 10) / 10, clear: Math.round(Math.min(18, Math.max(11, r.clear + (Math.random() - 0.5) * 0.8)) * 10) / 10 }));
  }

  private toastTimer?: ReturnType<typeof setTimeout>;

  toggleLayer(id: LayerId): void {
    this.layers.update((l) => ({ ...l, [id]: !l[id] }));
  }


  confirmVerification(): void {
    this.cameraModal.set(null);
    this.showToast('تم اعتماد التنبيه كحالة مؤكدة وتوجيه أقرب دورية مرور للموقع');
  }

  handleIncident(): void {
    this.incidentHandled.set(true);
    this.showToast('تم تحديث حالة الحادث #TRF-904 وتوجيه فرقة الإخلاء');
  }

  showToast(msg: string): void {
    this.toast.set(msg);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3500);
  }
}
