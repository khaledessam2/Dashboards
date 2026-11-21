import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-traffic-cameras-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './cameras-view.html',
})
export class CamerasView {
  protected readonly zones = [
    { name: 'المنطقة المركزية ومحيط الحرم', pct: '99.2%', color: 'text-[#059669]', note: '248 متصلة من 250 | 210 تحليل VISuite' },
    { name: 'الدائري الأول والثاني والتقاطعات', pct: '95.8%', color: 'text-[#0b5cff]', note: '228 متصلة من 238 | 145 تحليل VISuite' },
    { name: 'طريق المطار ومحطة القطار والمواقف', pct: '94.4%', color: 'text-[#d97706]', note: '136 متصلة من 144 | 65 تحليل VISuite' },
  ];
}
