import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, effect, inject, input, signal } from '@angular/core';
import Highcharts from 'highcharts';
import 'highcharts/highcharts-more';

/** Generic Highcharts wrapper: pass options, it styles + keeps them in sync. */
@Component({
  selector: 'app-hc-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full [direction:ltr]', '[style.height]': "height() ? height() + 'px' : '100%'", '[class.kpi-flash]': 'flashing()' },
  templateUrl: './hc-chart.html',
})
export class HcChart {
  readonly options = input.required<Highcharts.Options>();
  readonly height = input<number>(240);

  /** Green inset glow when the data behind the chart changes (same effect as the KPI cards). */
  protected readonly flashing = signal(false);
  private signature?: string;
  private flashTimer?: ReturnType<typeof setTimeout>;
  private chart?: Highcharts.Chart;
  /** Series layout (type + name per series). When it changes the chart is rebuilt: Highcharts matches series by index and would leak the old series' settings into the new ones. */
  private structure?: string;
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  private structureOf(o: Highcharts.Options): string {
    return JSON.stringify((o.series ?? []).map((x) => [(x as { type?: string }).type, (x as { name?: string }).name]));
  }

  private merged(o: Highcharts.Options): Highcharts.Options {
    return Highcharts.merge(
      {
        chart: { backgroundColor: 'transparent', spacing: [8, 4, 4, 4] },
        title: { text: undefined },
        credits: { enabled: false },
        legend: { itemStyle: { color: 'var(--text-2)', fontWeight: '500' } },
        xAxis: { lineColor: 'var(--grid)', tickLength: 0, labels: { style: { color: 'var(--text-2)' } } },
        yAxis: { title: { text: undefined }, gridLineColor: 'var(--grid)', labels: { style: { color: 'var(--text-2)' } } },
        tooltip: { shared: true },
      },
      o,
    );
  }

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const o = this.options();
      this.chart = Highcharts.chart(this.el.nativeElement, this.merged(o));
      this.structure = this.structureOf(o);
      const box = this.el.nativeElement.getBoundingClientRect();
      if (box.width > 0 && box.height > 0) this.chart.setSize(box.width, box.height, false);
      // Highcharts only reflows on window resize; follow the container too (cards that settle or stretch after first paint).
      const ro = new ResizeObserver((entries) => {
        const r = entries[0].contentRect;
        if (r.width > 0 && r.height > 0) this.chart?.setSize(r.width, r.height, false);
      });
      ro.observe(this.el.nativeElement);
      destroyRef.onDestroy(() => {
        ro.disconnect();
        this.chart?.destroy();
      });
    });
    effect(() => {
      const o = this.options();
      if (this.chart) {
        const structure = this.structureOf(o);
        if (structure !== this.structure) {
          this.chart.destroy();
          this.chart = Highcharts.chart(this.el.nativeElement, this.merged(o));
          this.structure = structure;
          const box = this.el.nativeElement.getBoundingClientRect();
          if (box.width > 0 && box.height > 0) this.chart.setSize(box.width, box.height, false);
        } else {
          this.chart.update(this.merged(o), true, true);
        }
      }
      const sig = JSON.stringify(o.series?.map((x) => (x as { data?: unknown }).data));
      if (this.signature !== undefined && this.signature !== sig) {
        this.flashing.set(true);
        clearTimeout(this.flashTimer);
        this.flashTimer = setTimeout(() => this.flashing.set(false), 2200);
      }
      this.signature = sig;
    });
    destroyRef.onDestroy(() => clearTimeout(this.flashTimer));
  }
}
