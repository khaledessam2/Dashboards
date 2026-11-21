import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FlashOnChange } from '../../../../shared/directives/flash-on-change';
import { MunicipalityCommandStore } from '../../../../shared/services/municipality-command-store';

@Component({
  selector: 'app-muni-lighting-view',
  imports: [FlashOnChange],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './lighting-view.html',
})
export class LightingView {
  protected readonly store = inject(MunicipalityCommandStore);

  protected readonly faults = [
    { ar: 'فشل التغذية / الحمل', v: 54, c: 'text-[#e11d48]' },
    { ar: 'انحراف الجهد الكهربائي', v: 31, c: 'text-[#d97706]' },
    { ar: 'معامل القدرة (Power Factor)', v: 19, c: 'text-[#0891b2]' },
    { ar: 'حجب حساس الضوء', v: 16, c: 'text-[#059669]' },
    { ar: 'أعطال جزئية / متقطعة', v: 22, c: 'text-ink' },
  ];
}
