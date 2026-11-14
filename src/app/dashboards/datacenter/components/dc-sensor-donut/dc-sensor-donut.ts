import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, computed, effect, inject, viewChild } from '@angular/core';
import Highcharts from 'highcharts';
import { STATUS_META, STATUS_ORDER } from '../../../../shared/constants/datacenter.constants';
import { DatacenterStore } from '../../../../shared/services/datacenter-store';

/** KPI-Documentation §4.10 — sensor status donut with legend. */
@Component({
  selector: 'app-dc-sensor-donut',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { id: 'sensor-donut', class: 'card' },
  templateUrl: './dc-sensor-donut.html',
})
export class DcSensorDonut {
  private readonly container = viewChild.required<ElementRef<HTMLElement>>('chart');
  private readonly counts = inject(DatacenterStore).statusCounts;
  private chart?: Highcharts.Chart;

  protected readonly total = computed(() => STATUS_ORDER.reduce((a, s) => a + this.counts()[s], 0));

  protected readonly segments = computed(() =>
    (['up', 'down', 'warning', 'unusual', 'paused'] as const).map((status) => ({
      status,
      count: this.counts()[status],
      ar: STATUS_META[status].ar,
      color: STATUS_META[status].color,
    })),
  );

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const chart = (this.chart = Highcharts.chart(this.container().nativeElement, {
        chart: { type: 'pie', backgroundColor: 'transparent', spacing: [0, 0, 0, 0] },
        title: this.titleOptions(),
        credits: { enabled: false },
        legend: {
          enabled: true,
          align: 'center',
          verticalAlign: 'bottom',
          layout: 'horizontal',
          rtl: true,
          itemWidth: 142,
          width: 430,
          itemMarginBottom: 8,
          symbolWidth: 0,
          symbolHeight: 0,
          squareSymbol: false,
          useHTML: true,
          itemStyle: { fontSize: '15px', fontWeight: '500', color: '#475569' },
          itemHoverStyle: { color: '#475569' },
          labelFormatter() {
            const p = this as unknown as Highcharts.Point;
            return `<span style="display:flex;align-items:center;justify-content:flex-start;gap:6px;direction:rtl;width:136px">
              <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${p.color};flex:none">&#8203;</span>
              <span style="flex:1;white-space:nowrap">${p.name}</span>
              <b style="color:${p.color};background:${p.color}1a;min-width:26px;text-align:center;padding:2px 6px;border-radius:999px;font-size:13px">${p.y}</b></span>`;
          },
        },
        tooltip: { pointFormat: '<b>{point.y}</b> ({point.percentage:.1f}%)' },
        plotOptions: {
          pie: {
            innerSize: '68%',
            size: '80%',
            center: ['50%', '40%'],
            showInLegend: true,
            borderWidth: 0,
            dataLabels: { enabled: false },
            states: { inactive: { enabled: false }, hover: { brightness: 0 } },
            point: { events: { legendItemClick: () => false } },
          },
        },
        series: [{ type: 'pie', name: 'الحساسات', data: this.seriesData() }],
      }));
      destroyRef.onDestroy(() => chart.destroy());
    });
    effect(() => {
      const data = this.seriesData();
      this.chart?.update({ title: this.titleOptions() }, false);
      this.chart?.series[0].setData(data, true, { duration: 400 });
    });
  }

  private titleOptions(): Highcharts.TitleOptions {
    return {
      useHTML: true,
      verticalAlign: 'middle',
      y: -34,
      text: `<div style="text-align:center;line-height:1.2"><div style="font-size:34px;font-weight:600;color:#1e293b">${this.total()}</div><div style="font-size:15px;color:#64748b">حساس</div></div>`,
    };
  }

  private seriesData(): Highcharts.PointOptionsObject[] {
    return this.segments().map((s) => ({ name: s.ar, y: s.count, color: s.color }));
  }
}
