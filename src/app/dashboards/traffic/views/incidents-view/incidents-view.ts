import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-traffic-incidents-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './incidents-view.html',
})
export class IncidentsView {
  protected readonly rows = [
    { id: '#INC-904', kind: 'حادث مروري (تصادم)', kc: 'text-[#e11d48]', loc: 'الدائري الأول - تقاطع قباء (إغلاق حارة يمنى)', src: '911 + VISuite', st: 'متأخر عن المستهدف (18د)', sc: 'bg-[#fff1f2] text-[#e11d48]', owner: 'مرور المدينة' },
    { id: '#NWC-211', kind: 'كسر أنبوب مياه وتجمع', kc: 'text-[#059669]', loc: 'طريق السلام - المسار الأيمن', src: 'شركة المياه + 940', st: 'فرقة الصيانة بالموقع', sc: 'bg-[#fffbeb] text-[#d97706]', owner: 'شركة المياه الوطنية' },
    { id: '#MUN-518', kind: 'سقوط لوحة إرشادية وعائق رصيف', kc: 'text-[#d97706]', loc: 'طريق الملك فهد - قرب محطة الحافلات', src: 'بلاغات 940', st: 'جارٍ الإزالة', sc: 'bg-[#ecfdf5] text-[#059669]', owner: 'أمانة منطقة المدينة المنورة' },
  ];
}
