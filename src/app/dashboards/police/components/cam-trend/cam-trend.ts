import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type Highcharts from 'highcharts';
import { HcChart } from '../../../../shared/components/ops-widgets/hc-chart/hc-chart';
import { camId } from '../../../../shared/constants/police.constants';
import { PoliceStore } from '../../../../shared/services/police-store';

const COLORS = ['#0b5cff', '#8b5cf6', '#14b8a6', '#10b981', '#f59e0b'];

/** 5-point moving average so the trend reads as a curve, not hourly noise. */
const smooth = (d: number[]) => d.map((_, i) => { const w = d.slice(Math.max(0, i - 2), i + 3); return +(w.reduce((a, b) => a + b, 0) / w.length).toFixed(1); });

/** الأحداث حسب الكاميرا (الاتجاه الزمني) (#21): legend items toggle a camera and highlight it on hover. */
@Component({
  selector: 'app-police-cam-trend',
  imports: [HcChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'pcard' },
  templateUrl: './cam-trend.html',
})
export class PoliceCamTrend {
  private readonly store = inject(PoliceStore);

  /** Names of the cameras hidden by the user. */
  protected readonly hidden = signal<ReadonlySet<string>>(new Set());
  protected readonly hovered = signal<string | null>(null);

  protected readonly legend = computed(() =>
    this.store.cameraSeries().map((s, i) => ({ key: s.name, name: camId(s.name), total: s.total, color: COLORS[i % COLORS.length] })),
  );

  protected toggle(key: string): void {
    this.hidden.update((h) => {
      const next = new Set(h);
      if (!next.delete(key)) next.add(key);
      // never hide every camera: keep the chart readable
      return next.size >= this.store.cameraSeries().length ? h : next;
    });
  }

  protected readonly options = computed<Highcharts.Options>(() => {
    const labels = this.store.timeline().map((h) => h.label);
    const hidden = this.hidden();
    const hovered = this.hovered();
    return {
      chart: { type: 'areaspline', spacing: [8, 4, 0, 4] },
      legend: { enabled: false },
      xAxis: { categories: labels, tickInterval: Math.ceil(labels.length / 5), labels: { style: { fontSize: '11px', color: '#8a99af' } } },
      yAxis: { visible: false, min: 0 },
      tooltip: { shared: true },
      plotOptions: { series: { marker: { enabled: false }, lineWidth: 2, animation: false }, areaspline: { fillOpacity: 0.05 } },
      series: this.store.cameraSeries().map((s, i) => ({
        type: 'areaspline',
        name: camId(s.name),
        data: smooth(s.data),
        color: COLORS[i % COLORS.length],
        visible: !hidden.has(s.name),
        opacity: hovered && hovered !== s.name ? 0.15 : 1,
      })),
    };
  });
}
