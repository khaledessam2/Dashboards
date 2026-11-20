import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type Highcharts from 'highcharts';
import { HcChart } from '../../../../shared/components/ops-widgets/hc-chart/hc-chart';

export interface BreakdownItem {
  name: string;
  y: number;
  color: string;
  pct: number;
}

/**
 * Donut + legend card. `stacked`: big donut over a list of rows with count (objects by type, #14).
 * `side`: legend beside a small donut (events by type, #12).
 */
@Component({
  selector: 'app-police-breakdown',
  imports: [HcChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'pcard' },
  templateUrl: './breakdown.html',
})
export class PoliceBreakdown {
  readonly title = input.required<string>();
  readonly badge = input<string>('');
  readonly icon = input<string>('');
  readonly items = input.required<BreakdownItem[]>();
  readonly centerLabel = input<string>('');
  readonly layout = input<'stacked' | 'side'>('side');
  readonly footnote = input<string>('');

  protected readonly total = computed(() => this.items().reduce((s, i) => s + i.y, 0));

  protected readonly options = computed<Highcharts.Options>(() => ({
    chart: { type: 'pie', spacing: [0, 0, 0, 0] },
    legend: { enabled: false },
    tooltip: { pointFormat: '<b>{point.y:,.0f}</b> ({point.percentage:.0f}%)' },
    plotOptions: { pie: { innerSize: this.layout() === 'stacked' ? '80%' : '68%', borderWidth: 3, borderColor: '#ffffff', dataLabels: { enabled: false }, states: { inactive: { opacity: 1 } } } },
    series: [{ type: 'pie', name: this.title(), data: this.items().map((i) => ({ name: i.name, y: i.y, color: i.color })) }],
  }));
}
