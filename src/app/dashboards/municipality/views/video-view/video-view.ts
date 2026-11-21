import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-muni-video-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './video-view.html',
})
export class VideoView {
  protected readonly cards = [
    { label: 'الأجسام المتروكة في الأماكن العامة', val: '11 حالة', note: 'توجيه فرق النظافة أو التفتيش بعد المراجعة البصرية', c: 'text-[#059669]' },
    { label: 'تكرار الزحام المروري حسب الموقع', val: '6 تقاطعات', note: 'مقترحة للدراسة الميدانية والتحسين الهندسي', c: 'text-[#d97706]' },
    { label: 'مواقع رصد السقوط والتعثر', val: '4 مواقع', note: 'مجدولة لفحص سلامة الأرصفة والممرات', c: 'text-[#e11d48]' },
  ];
}
