import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MunicipalityCommandStore } from '../../../../shared/services/municipality-command-store';

@Component({
  selector: 'app-muni-reports-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './reports-view.html',
})
export class ReportsView {
  protected readonly store = inject(MunicipalityCommandStore);

  protected readonly contractors = [
    { name: 'شركة تشغيل وصيانة الإنارة الذكية', scope: 'كامل النطاق', pct: '94.2%', reopen: '1.8%', rate: 'ممتاز', ok: true },
    { name: 'مقاول صيانة الطرق والأرصفة (القطاع الجنوبي)', scope: 'قباء والعوالي', pct: '81.5%', reopen: '6.4%', rate: 'يحتاج متابعة', ok: false },
    { name: 'مقاول النظافة بالمنطقة المركزية', scope: 'المنطقة المركزية', pct: '96.0%', reopen: '1.1%', rate: 'ممتاز', ok: true },
  ];
}
