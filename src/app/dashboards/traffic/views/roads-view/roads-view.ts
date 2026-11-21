import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-traffic-roads-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './roads-view.html',
})
export class RoadsView {
  protected readonly works = [
    { title: 'تصريح حفر #NSQ-882 | تمديد كابلات', note: 'الموقع: طريق سلطانة (إغلاق جزئي لمسار الخدمة) | المدة: 3 أيام متبقية' },
    { title: 'صيانة إنارة وتشجير | أمر عمل #MNT-409', note: 'الموقع: الدائري الثاني الشمالي | مجدول خارج أوقات الذروة (01:00 - 05:00 ص)' },
  ];
  protected readonly routes = [
    { title: 'مسار قطار الحرمين ← الحرم النبوي', note: 'التردد: كل 5 دقائق | زمن الرحلة: 14 دقيقة', nc: 'text-[#059669]', badge: 'منتظم', bc: 'bg-[#ecfdf5] text-[#059669]' },
    { title: 'مسار مواقف سيد الشهداء ← الساحة الشمالية', note: 'تأخير طفيف +3 دقائق عند نقطة الإنزال', nc: 'text-[#d97706]', badge: 'ضغط مرتفع', bc: 'bg-[#fffbeb] text-[#d97706]' },
  ];
}
