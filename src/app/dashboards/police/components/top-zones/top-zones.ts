import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, effect, inject, viewChild } from '@angular/core';
import Highcharts from 'highcharts';
import { ZoneStat } from '../../../../shared/models/police.model';
import { PoliceStore } from '../../../../shared/services/police-store';

@Component({
  selector: 'app-police-top-zones',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { id: 'top-zones', class: 'card' },
  templateUrl: './top-zones.html',
})
export class PoliceTopZones {
  private readonly container = viewChild.required<ElementRef<HTMLElement>>('chart');
  private readonly store = inject(PoliceStore);
  private chart?: Highcharts.Chart;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const chart = (this.chart = Highcharts.chart(this.container().nativeElement, {
        chart: { type: 'bar', backgroundColor: 'transparent', spacing: [0, 0, 0, 8], marginRight: 130 },
        title: { text: undefined },
        credits: { enabled: false },
        legend: { enabled: false },
        xAxis: {
          categories: [],
          opposite: true,
          lineWidth: 0,
          tickLength: 0,
          labels: { align: 'right', x: 130, style: { color: 'var(--text-2)', fontSize: '15px' , fontWeight:'600' } },
        },
        yAxis: { title: { text: undefined }, visible: false, min: 0, reversed: true },
        tooltip: { headerFormat: '', pointFormat: '{point.category}: <b>{point.y:,.0f}</b>' },
        plotOptions: {
          bar: {
            borderWidth: 0,
            borderRadius: 2,
            pointWidth: 15,
            color: '#00a651',
            dataLabels: { enabled: true, format: '{y:,.0f}', style: {  fontSize: '16px' , color: 'var(--text-2)', fontWeight: '600', textOutline: 'none' } },
          },
        },
        series: [{ type: 'bar', name: 'حركة', data: [] }],
      }));
      this.apply(this.store.zones());
      destroyRef.onDestroy(() => chart.destroy());
    });
    effect(() => this.apply(this.store.zones()));
  }

  private apply(zones: ZoneStat[]): void {
    if (!this.chart) return;
    const ranked = [...zones].sort((a, b) => b.value - a.value);
    this.chart.xAxis[0].setCategories(ranked.map((z) => z.ar), false);
    this.chart.series[0].setData(
      ranked.map((z, i) => ({ y: z.value, opacity: i === 0 ? 1 : 0.65 })),
      true,
      false,
    );
  }
}
