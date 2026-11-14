import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, computed, effect, inject, signal, viewChildren } from '@angular/core';
import Highcharts from 'highcharts';
import { STATUS_META } from '../../../../shared/constants/datacenter.constants';
import { PrtgStatus } from '../../../../shared/models/datacenter.model';
import { DatacenterStore } from '../../../../shared/services/datacenter-store';

const ROW_HEIGHT = 34;
const CHART_PADDING = 24;

/** KPI-Documentation §4.11 — stacked bars per device group (up/down/warning/unusual/paused), split into two charts. */
@Component({
  selector: 'app-dc-group-health',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { id: 'group-health', class: 'card' },
  templateUrl: './dc-group-health.html',
})
export class DcGroupHealth {
  private readonly containers = viewChildren<ElementRef<HTMLElement>>('chart');
  private readonly groups = inject(DatacenterStore).groupHealth;
  private charts: Highcharts.Chart[] = [];

  protected readonly meta = STATUS_META;
  protected readonly statuses: PrtgStatus[] = ['up', 'down', 'warning', 'unusual', 'paused'];
  protected readonly indexes = [0, 1];
  protected readonly hidden = signal<ReadonlySet<PrtgStatus>>(new Set());

  protected toggle(status: PrtgStatus): void {
    this.hidden.update((h) => {
      const next = new Set(h);
      if (!next.delete(status)) next.add(status);
      return next;
    });
  }

  private readonly halves = computed(() => {
    const all = this.groups();
    const mid = Math.ceil(all.length / 2);
    return [all.slice(0, mid), all.slice(mid)];
  });
  protected readonly height = computed(() => Math.max(160, this.halves()[0].length * ROW_HEIGHT + CHART_PADDING));

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this.charts = this.containers().map((c, i) =>
        Highcharts.chart(c.nativeElement, {
          chart: { type: 'bar', backgroundColor: 'transparent', spacing: [0, 0, 0, 4], height: this.height() },
          title: { text: undefined },
          credits: { enabled: false },
          legend: { enabled: false },
          xAxis: {
            opposite: true,
            categories: this.categories(i),
            lineWidth: 0,
            tickLength: 0,
            labels: { style: { fontSize: '15px', fontWeight: '500', color: '#1e293b', textOverflow: 'ellipsis' }, reserveSpace: true },
          },
          yAxis: { visible: false, min: 0, reversed: true },
          tooltip: {
            shared: false,
            pointFormat: '<span style="color:{series.color}">●</span> {series.name}: <b>{point.y}</b><br/>',
          },
          plotOptions: {
            series: {
              stacking: 'normal',
              borderWidth: 0,
              states: { inactive: { enabled: false }, hover: { brightness: 0.05 } },
            },
            bar: { pointPadding: 0.15, groupPadding: 0, borderRadius: 4 },
          },
          series: this.seriesData(i),
        }),
      );
      destroyRef.onDestroy(() => this.charts.forEach((c) => c.destroy()));
    });

    effect(() => {
      const hidden = this.hidden();
      this.charts.forEach((chart) => {
        this.statuses.forEach((s, si) => chart.series[si].setVisible(!hidden.has(s), false));
        chart.redraw({ duration: 300 });
      });
    });

    effect(() => {
      const height = this.height();
      const halves = this.halves();
      this.charts.forEach((chart, i) => {
        chart.xAxis[0].setCategories(this.categories(i, halves), false);
        this.seriesData(i, halves).forEach((s, si) => chart.series[si].setData(s.data, false));
        chart.setSize(null, height, false);
        chart.redraw({ duration: 400 });
      });
    });
  }

  private categories(i: number, halves = this.halves()): string[] {
    return halves[i].map((g) => `${g.name} (${g.total})`);
  }

  private seriesData(i: number, halves = this.halves()): Highcharts.SeriesBarOptions[] {
    return this.statuses.map((s) => ({
      type: 'bar',
      name: STATUS_META[s].ar,
      color: STATUS_META[s].color,
      data: halves[i].map((g) => g.counts[s]),
    }));
  }
}
