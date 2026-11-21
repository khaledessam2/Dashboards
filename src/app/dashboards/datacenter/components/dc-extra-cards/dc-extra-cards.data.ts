export type Sev = 'ok' | 'warn' | 'crit';

export interface ExtraMetric {
  label: string;
  value: string;
  sev?: Sev;
}

export interface ExtraBar {
  label: string;
  /** 0–100 */
  pct: number;
  text: string;
  sev?: Sev;
}

export interface ExtraRow {
  cells: string[];
  sev?: Sev;
}

export interface ExtraCardDef {
  id: string;
  ar: string;
  icon: string;
  /** Integration source (shown as subtitle). */
  source: string;
  kind: 'metrics' | 'bars' | 'table';
  metrics?: ExtraMetric[];
  bars?: ExtraBar[];
  headers?: string[];
  rows?: ExtraRow[];
  /** Optional metrics shown above bars/table. */
  summary?: ExtraMetric[];
}

/** Mock data for the 18 proposed additions (until real integrations are wired). */
export const EXTRA_CARDS: ExtraCardDef[] = [
  {
    id: 'x-availability', ar: 'التوافر التشغيلي للخدمات', icon: 'verified', source: 'PRTG / Zabbix', kind: 'bars',
    summary: [{ label: 'انقطاعات الشهر', value: '4', sev: 'warn' }, { label: 'إجمالي المدة', value: '38 د' }],
    bars: [
      { label: 'REST API', pct: 99.97, text: '99.97%', sev: 'ok' },
      { label: 'قاعدة البيانات', pct: 99.95, text: '99.95%', sev: 'ok' },
      { label: 'RabbitMQ', pct: 99.61, text: '99.61%', sev: 'warn' },
      { label: 'قناة SSE', pct: 98.4, text: '98.40%', sev: 'crit' },
    ],
  },
  {
    id: 'x-sla', ar: 'الالتزام باتفاقيات مستوى الخدمة (SLA)', icon: 'handshake', source: 'Zabbix SLA / ITSM', kind: 'metrics',
    metrics: [
      { label: 'خدمات محققة للتوافر', value: '14 / 16', sev: 'ok' },
      { label: 'محققة لزمن الاستجابة', value: '13 / 16', sev: 'warn' },
      { label: 'حالات تجاوز SLA (الشهر)', value: '3', sev: 'warn' },
      { label: 'أداء الموردين', value: '96%', sev: 'ok' },
    ],
  },
  {
    id: 'x-capacity', ar: 'السعة المستقبلية (Capacity Forecasting)', icon: 'trending_up', source: 'PRTG Historic / Prometheus', kind: 'bars',
    bars: [
      { label: 'CPU — يصل 90%', pct: 72, text: 'بعد 94 يوم', sev: 'ok' },
      { label: 'RAM — يصل 90%', pct: 81, text: 'بعد 41 يوم', sev: 'warn' },
      { label: 'التخزين — يصل 90%', pct: 88, text: 'بعد 19 يوم', sev: 'crit' },
    ],
  },
  {
    id: 'x-storage', ar: 'السعة المتاحة للتخزين والنمو', icon: 'hard_drive', source: 'Node Exporter / SNMP', kind: 'table',
    headers: ['الوحدة', 'مستخدم', 'نمو/شهر', 'الامتلاء'],
    rows: [
      { cells: ['SAN-01', '78%', '+2.1%', '52 يوم'], sev: 'warn' },
      { cells: ['NAS-02', '91%', '+3.4%', '9 أيام'], sev: 'crit' },
      { cells: ['VMware DS-03', '54%', '+1.2%', '210 يوم'], sev: 'ok' },
    ],
  },
  {
    id: 'x-dr-ready', ar: 'جاهزية التعافي من الكوارث (DR Readiness)', icon: 'health_and_safety', source: 'Veeam REST API', kind: 'metrics',
    metrics: [
      { label: 'نجاح النسخ الاحتياطية', value: '98.2%', sev: 'ok' },
      { label: 'آخر نسخة ناجحة', value: 'قبل 3 ساعات', sev: 'ok' },
      { label: 'عمر آخر اختبار DR', value: '47 يوم', sev: 'warn' },
      { label: 'أنظمة بدون اختبار استعادة', value: '5', sev: 'crit' },
    ],
  },
  {
    id: 'x-restore', ar: 'اختبار قابلية استعادة النسخ', icon: 'settings_backup_restore', source: 'Veeam REST API', kind: 'metrics',
    metrics: [
      { label: 'استعادات ناجحة', value: '42 / 46', sev: 'ok' },
      { label: 'نسبة فشل الاختبارات', value: '8.7%', sev: 'warn' },
      { label: 'متوسط مدة الاستعادة', value: '18 د' },
      { label: 'أطول استعادة', value: '52 د', sev: 'warn' },
    ],
  },
  {
    id: 'x-security', ar: 'الأمن السيبراني والتنبيهات الأمنية', icon: 'shield', source: 'Microsoft Sentinel / SIEM', kind: 'metrics',
    metrics: [
      { label: 'تنبيهات حرجة', value: '6', sev: 'crit' },
      { label: 'محاولات دخول غير معتادة', value: '23', sev: 'warn' },
      { label: 'أجهزة عالية الخطورة', value: '9', sev: 'warn' },
      { label: 'حوادث قيد المعالجة', value: '4' },
      { label: 'حوادث مغلقة اليوم', value: '11', sev: 'ok' },
    ],
  },
  {
    id: 'x-vuln', ar: 'الثغرات والتحديثات الأمنية', icon: 'bug_report', source: 'Tenable / Defender VM', kind: 'bars',
    summary: [{ label: 'خوادم بدون تحديثات', value: '17', sev: 'warn' }, { label: 'متجاوزة لموعد المعالجة', value: '8', sev: 'crit' }],
    bars: [
      { label: 'حرجة', pct: 12, text: '12', sev: 'crit' },
      { label: 'عالية', pct: 34, text: '34', sev: 'warn' },
      { label: 'متوسطة', pct: 61, text: '61', sev: 'warn' },
      { label: 'منخفضة', pct: 45, text: '45', sev: 'ok' },
    ],
  },
  {
    id: 'x-db', ar: 'مراقبة قواعد البيانات', icon: 'database', source: 'SQL Server DMVs', kind: 'metrics',
    metrics: [
      { label: 'الاتصالات النشطة', value: '312' },
      { label: 'استعلامات بطيئة', value: '7', sev: 'warn' },
      { label: 'المعالج / الذاكرة', value: '46% / 71%' },
      { label: 'حجم القواعد', value: '1.8 TB' },
      { label: 'النسخ الاحتياطي', value: 'ناجح', sev: 'ok' },
    ],
  },
  {
    id: 'x-mq', ar: 'خدمات التكامل والرسائل', icon: 'swap_calls', source: 'RabbitMQ Management API', kind: 'metrics',
    metrics: [
      { label: 'رسائل في الطوابير', value: '1,284' },
      { label: 'رسائل متأخرة', value: '96', sev: 'warn' },
      { label: 'رسائل فاشلة', value: '14', sev: 'crit' },
      { label: 'معدل المعالجة', value: '420 /ث', sev: 'ok' },
      { label: 'الاتصالات', value: '38 / 40', sev: 'ok' },
    ],
  },
  {
    id: 'x-apm', ar: 'أداء التطبيقات وواجهات API', icon: 'api', source: 'OpenTelemetry / Prometheus', kind: 'metrics',
    metrics: [
      { label: 'زمن استجابة API (p95)', value: '184 ms', sev: 'ok' },
      { label: 'أخطاء 4xx', value: '1.2%', sev: 'ok' },
      { label: 'أخطاء 5xx', value: '0.6%', sev: 'warn' },
      { label: 'الطلبات / دقيقة', value: '8,420' },
      { label: 'معدل النجاح', value: '98.2%', sev: 'ok' },
      { label: 'نقطة الاختناق', value: '/api/sensors', sev: 'warn' },
    ],
  },
  {
    id: 'x-dex', ar: 'مراقبة تجربة المستخدم', icon: 'speed', source: 'Synthetic Monitoring / RUM', kind: 'metrics',
    metrics: [
      { label: 'زمن تحميل الصفحة', value: '1.9 ث', sev: 'ok' },
      { label: 'نجاح تسجيل الدخول', value: '99.4%', sev: 'ok' },
      { label: 'فشل العمليات الرئيسية', value: '0.8%', sev: 'warn' },
      { label: 'زمن رحلة المستخدم', value: '6.2 ث', sev: 'warn' },
    ],
  },
  {
    id: 'x-env', ar: 'البيئة الفيزيائية لمركز البيانات', icon: 'thermostat', source: 'DCIM / BMS', kind: 'table',
    headers: ['الممر / الرف', 'حرارة', 'رطوبة', 'الحالة'],
    rows: [
      { cells: ['ممر A', '24°C', '44%', 'طبيعي'], sev: 'ok' },
      { cells: ['ممر B', '27°C', '47%', 'مرتفع'], sev: 'warn' },
      { cells: ['ممر C — رف 7', '33°C', '41%', 'حرج'], sev: 'crit' },
      { cells: ['تسرب مياه / دخان', '—', '—', 'لا يوجد'], sev: 'ok' },
    ],
  },
  {
    id: 'x-energy', ar: 'كفاءة الطاقة والتكلفة', icon: 'energy_savings_leaf', source: 'Smart Meters / DCIM', kind: 'metrics',
    metrics: [
      { label: 'PUE الحالي', value: '1.35', sev: 'ok' },
      { label: 'PUE متوسط الشهر', value: '1.41', sev: 'warn' },
      { label: 'الحمل التقني', value: '412 kW' },
      { label: 'استهلاك الشهر', value: '298 MWh' },
      { label: 'التكلفة التقديرية', value: '89,400 ر.س' },
    ],
  },
  {
    id: 'x-intersite', ar: 'الاتصال بين المواقع', icon: 'lan', source: 'PRTG / Zabbix / NetFlow', kind: 'table',
    headers: ['الرابط', 'تأخير', 'فقد', 'Jitter'],
    rows: [
      { cells: ['DC-1 ⇄ DC-2', '2 ms', '0%', '0.4 ms'], sev: 'ok' },
      { cells: ['DC-1 ⇄ DR', '11 ms', '0.1%', '1.8 ms'], sev: 'ok' },
      { cells: ['DC-1 ⇄ Cloud', '38 ms', '0.9%', '6.2 ms'], sev: 'warn' },
    ],
  },
  {
    id: 'x-assets', ar: 'الأصول والتراخيص التقنية', icon: 'inventory_2', source: 'ServiceNow CMDB / Lansweeper', kind: 'metrics',
    metrics: [
      { label: 'إجمالي الخوادم والأجهزة', value: '1,126' },
      { label: 'تراخيص تنتهي خلال 90 يوم', value: '14', sev: 'warn' },
      { label: 'أجهزة خارج الضمان', value: '63', sev: 'warn' },
      { label: 'أصول غير مسجلة', value: '9', sev: 'crit' },
    ],
  },
  {
    id: 'x-mttr', ar: 'إدارة الحوادث ووقت المعالجة (MTTR)', icon: 'build_circle', source: 'ServiceNow / Jira SM', kind: 'metrics',
    metrics: [
      { label: 'حوادث P1 / P2 / P3', value: '2 / 7 / 19' },
      { label: 'متوسط زمن الاستجابة', value: '9 د', sev: 'ok' },
      { label: 'MTTR', value: '46 د', sev: 'warn' },
      { label: 'حوادث متكررة', value: '5', sev: 'warn' },
    ],
  },
  {
    id: 'x-cloud', ar: 'جاهزية مزودي الخدمات السحابية والاتصال', icon: 'cloud_sync', source: 'PRTG / تقارير CST', kind: 'table',
    headers: ['المزود / الموقع', 'استجابة', 'توافر'],
    rows: [
      { cells: ['مزود A — الرياض', '24 ms', '99.98%'], sev: 'ok' },
      { cells: ['مزود B — جدة', '41 ms', '99.90%'], sev: 'ok' },
      { cells: ['مزود C — الدمام', '88 ms', '99.12%'], sev: 'warn' },
    ],
  },
];
