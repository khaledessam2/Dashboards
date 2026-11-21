import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Cluster health summary (mock percentages per operational domain). */
@Component({
  selector: 'app-dc-cluster-health',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { id: 'cluster-health', class: 'card' },
  template: `
    <header class="mb-3 flex items-center justify-between gap-2">
      <h2 class="m-0 my-3 text-[20px] leading-6 font-semibold text-slate-600">صحة المجموعات (Cluster Health)</h2>
      <span class="rounded-full bg-green-600/10 px-2.5 py-0.5 text-[13px] font-semibold text-green-700">100% جاهزية تامة</span>
    </header>
    <div class="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3">
      @for (c of clusters; track c.ar) {
        <div class="flex items-center justify-between gap-2 rounded-lg bg-[#f6f8fb] px-3 py-2.5">
          <span class="text-[16px] text-ink-2">{{ c.ar }}</span>
          <b class="num text-[16px]" [style.color]="c.pct >= 95 ? 'var(--sev-green)' : c.pct >= 90 ? 'var(--text)' : 'var(--sev-amber)'">{{ c.pct }}%</b>
        </div>
      }
    </div>
  `,
})
export class DcClusterHealth {
  protected readonly clusters = [
    { ar: 'الخوادم', pct: 98 },
    { ar: 'الشبكة', pct: 92 },
    { ar: 'التخزين', pct: 87 },
    { ar: 'قواعد البيانات', pct: 95 },
    { ar: 'الطاقة والتبريد', pct: 93 },
    { ar: 'النسخ الاحتياطي', pct: 100 },
  ];
}
