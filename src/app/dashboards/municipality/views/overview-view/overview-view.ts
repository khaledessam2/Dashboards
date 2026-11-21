import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import type Highcharts from 'highcharts';
import { FlashOnChange } from '../../../../shared/directives/flash-on-change';
import { HcChart } from '../../../../shared/components/ops-widgets/ops-widgets';
import { MuniMap } from '../../components/muni-map/muni-map';
import { MunicipalityCommandStore, MuniPriority } from '../../../../shared/services/municipality-command-store';

@Component({
  selector: 'app-muni-overview-view',
  imports: [FlashOnChange, HcChart, MuniMap],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './overview-view.html',
})
export class OverviewView {
  protected readonly store = inject(MunicipalityCommandStore);

  protected prio(p: MuniPriority): string {
    return p === 'critical' ? '#e11d48' : p === 'high' ? '#d97706' : '#0b5cff';
  }

  protected readonly energyChart: Highcharts.Options = {
    chart: { type: 'areaspline', spacing: [10, 12, 0, 6] },
    xAxis: { categories: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'] },
    yAxis: { min: 100 },
    legend: { enabled: true, rtl: true, itemDistance: 12, itemStyle: { fontSize: '12px' } },
    tooltip: { shared: true, valueSuffix: ' MWh' },
    plotOptions: { areaspline: { lineWidth: 2.4, marker: { enabled: false } } },
    series: [
      { type: 'areaspline', name: 'الاستهلاك الفعلي', data: [132, 129, 127, 130, 126, 128], color: '#10b981', fillOpacity: 0.1 },
      { type: 'areaspline', name: 'خط الأساس', data: [162, 162, 162, 162, 165, 165], color: '#f59e0b', dashStyle: 'Dash', fillOpacity: 0 },
    ],
  };

  protected readonly sanChart: Highcharts.Options = {
    chart: { type: 'column', spacing: [10, 8, 0, 6] },
    xAxis: { categories: ['المركزية', 'قباء', 'العوالي', 'سلطانة', 'الحرة'] },
    yAxis: { min: 60, max: 100 },
    legend: { enabled: true, rtl: true },
    tooltip: { shared: true, valueSuffix: '%' },
    plotOptions: { column: { borderRadius: 4, borderWidth: 0, groupPadding: 0.12 } },
    series: [
      { type: 'column', name: 'إنجاز النظافة %', data: [97, 92, 90, 88, 86], color: '#10b981' },
      { type: 'column', name: 'التزام المقاولين %', data: [95, 84, 86, 89, 82], color: '#0b5cff' },
    ],
  };
}
