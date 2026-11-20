import type Highcharts from 'highcharts';

export interface LineSerie {
  name: string;
  data: number[];
  color: string;
  dashed?: boolean;
}

/** Smooth area/line chart. First series gets a soft area fill. */
export function lineOptions(categories: string[], series: LineSerie[], opts: { area?: boolean; suffix?: string } = {}): Highcharts.Options {
  const area = opts.area ?? true;
  return {
    chart: { type: area ? 'areaspline' : 'spline' },
    xAxis: { categories },
    yAxis: { min: 0 },
    tooltip: { shared: true, valueSuffix: opts.suffix ?? '' },
    plotOptions: { series: { marker: { enabled: false } } },
    series: series.map((s, i) => ({
      type: area && i === 0 ? 'areaspline' : 'spline',
      name: s.name,
      data: s.data,
      color: s.color,
      dashStyle: s.dashed ? 'ShortDash' : 'Solid',
      fillOpacity: i === 0 ? 0.12 : 0,
    })) as Highcharts.SeriesOptionsType[],
  };
}

/** Grouped columns (today vs. previous period). */
export function columnOptions(categories: string[], series: LineSerie[]): Highcharts.Options {
  return {
    chart: { type: 'column' },
    xAxis: { categories },
    yAxis: { min: 0 },
    plotOptions: { column: { borderRadius: 3, borderWidth: 0, pointPadding: 0.08 } },
    series: series.map((s) => ({ type: 'column', name: s.name, data: s.data, color: s.color })) as Highcharts.SeriesOptionsType[],
  };
}

export interface Slice {
  name: string;
  y: number;
  color: string;
}

/** Donut: total in the centre, legend underneath, white slice borders. */
export function donutOptions(data: Slice[], centerLabel = '', suffix = ''): Highcharts.Options {
  const total = data.reduce((s, d) => s + d.y, 0);
  return {
    chart: {
      type: 'pie',
      spacing: [0, 0, 0, 0],
      events: {
        // keep the centre text on the middle of the ring, whatever the legend height is
        render() {
          const c = this as Highcharts.Chart;
          const s = c.series[0] as Highcharts.Series & { center?: number[] };
          if (!s?.center || !c.title) return;
          c.title.attr({ x: s.center[0], y: s.center[1] - 4 });
        },
      },
    },
    title: {
      text: `<b>${total.toLocaleString('en-US')}</b><br/>${centerLabel}`,
      align: 'center',
      verticalAlign: 'middle',
      floating: true,
      style: { fontSize: '16px', color: 'var(--text)', textAlign: 'center' },
    },
    tooltip: { pointFormat: `<b>{point.y:,.0f}${suffix}</b>`, shared: false },
    legend: {
      enabled: true,
      layout: 'horizontal',
      rtl: true,
      align: 'center',
      verticalAlign: 'bottom',
      symbolRadius: 6,
      itemMarginTop: 2,
      itemMarginBottom: 2,
      itemStyle: { fontSize: '14px', color: 'var(--text-2)', fontWeight: '500' },
    },
    plotOptions: { pie: { innerSize: '70%', borderWidth: 2, borderColor: '#ffffff', showInLegend: true, dataLabels: { enabled: false } } },
    series: [{ type: 'pie', name: centerLabel, data }],
  };
}

export interface BarItem {
  label: string;
  value: number;
  color?: string;
}

const HEAT = (v: number) => (v >= 80 ? '#e74c3c' : v >= 60 ? '#f5a623' : '#00a651');

/** Horizontal ranked bars (RTL-friendly: labels on the right, same look as the existing "top zones" chart). */
export function barOptions(items: BarItem[], o: { max?: number; suffix?: string; heat?: boolean; color?: string } = {}): Highcharts.Options {
  return {
    chart: { type: 'bar', spacing: [0, 0, 0, 8], marginRight: 150 },
    legend: { enabled: false },
    xAxis: {
      categories: items.map((i) => i.label),
      opposite: true,
      lineWidth: 0,
      tickLength: 0,
      labels: { align: 'right', x: 150, style: { color: 'var(--text-2)', fontSize: '14px', fontWeight: '600', width: 140, textOverflow: 'ellipsis' } },
    },
    yAxis: { visible: false, min: 0, max: o.max, reversed: true, gridLineWidth: 0 },
    tooltip: { headerFormat: '', pointFormat: `{point.category}: <b>{point.y:,.1f}${o.suffix ?? ''}</b>`, shared: false },
    plotOptions: {
      bar: {
        borderWidth: 0,
        borderRadius: 3,
        pointWidth: 14,
        dataLabels: { enabled: true, format: `{y:,.0f}${o.suffix ?? ''}`, style: { fontSize: '14px', color: 'var(--text-2)', fontWeight: '600', textOutline: 'none' } },
      },
    },
    series: [
      {
        type: 'bar',
        name: '',
        data: items.map((i) => ({ y: i.value, color: i.color ?? (o.heat ? HEAT(i.value) : (o.color ?? '#2563eb')) })),
      },
    ],
  };
}

/** Vertical columns coloured per point (e.g. forecast per day). */
export function coloredColumns(items: BarItem[], o: { max?: number; suffix?: string; heat?: boolean; color?: string } = {}): Highcharts.Options {
  return {
    chart: { type: 'column' },
    legend: { enabled: false },
    xAxis: { categories: items.map((i) => i.label) },
    yAxis: { min: 0, max: o.max },
    tooltip: { headerFormat: '', pointFormat: `{point.category}: <b>{point.y:,.1f}${o.suffix ?? ''}</b>`, shared: false },
    plotOptions: { column: { borderRadius: 3, borderWidth: 0, dataLabels: { enabled: true, format: `{y:,.0f}${o.suffix ?? ''}`, style: { fontSize: '13px', color: 'var(--text-2)', textOutline: 'none' } } } },
    series: [{ type: 'column', name: '', data: items.map((i) => ({ y: i.value, color: i.color ?? (o.heat ? HEAT(i.value) : (o.color ?? '#2563eb')) })) }],
  };
}

