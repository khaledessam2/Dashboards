import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MunicipalityCommandStore } from '../../../../shared/services/municipality-command-store';

@Component({
  selector: 'app-muni-modals',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block', '(document:keydown.escape)': 'closeModals()' },
  templateUrl: './muni-modals.html',
})
export class MuniModals {
  protected readonly store = inject(MunicipalityCommandStore);

  protected readonly governance = [
    { group: 'الإنارة الذكية', system: 'نظام رسيل (Raseel)', owner: 'أمانة المدينة المنورة', refresh: 'كل 5 دقائق', status: 'معتمد ومتصل', ok: true },
    { group: 'البلاغات والصيانة', system: 'نظام 940 و CMMS', owner: 'الأمانة / الوكالات', refresh: 'لحظي', status: 'معتمد ومتصل', ok: true },
    { group: 'النظافة والحاويات', system: 'أنظمة المقاولين + GPS', owner: 'إدارة النظافة بالأمانة', refresh: 'كل 15 دقيقة', status: 'متصل', ok: true },
    { group: 'المياه وتصريف الأمطار', system: 'NWC + SCADA التصريف', owner: 'شركة المياه / الأمانة', refresh: 'كل 10 دقائق', status: 'تأخر طفيف (NWC)', ok: false },
    { group: 'الحفريات والتصاريح', system: 'منصة بلدي / نسق', owner: 'مكتب تنسيق المشاريع', refresh: 'كل 30 دقيقة', status: 'تكامل مرحلي', ok: false },
    { group: 'تحليل الفيديو', system: 'Ipsotek VISuite', owner: 'غرفة العمليات / المشروع', refresh: 'لحظي', status: 'مفعّل ومتصل', ok: true },
    { group: 'الطقس الرسمي', system: 'المركز الوطني للأرصاد NCM', owner: 'NCM', refresh: 'كل 10 دقائق', status: 'معتمد ومتصل', ok: true },
  ];

  protected closeModals(): void {
    this.store.traceUid.set(null);
    this.store.govOpen.set(false);
  }
}
