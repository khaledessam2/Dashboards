import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatTime12 } from '../../utils/time.utils';


/** "آخر تحديث: 03:13:41 م" — 12-hour clock time of the last data refresh. */
@Component({
  selector: 'app-last-updated',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'text-lg leading-6 font-medium text-ink-2 shrink-0 whitespace-nowrap max-[900px]:text-sm' },
  template: `<span class="material-symbols-outlined !text-[20px] align-middle ms-1">update</span>آخر تحديث: <span class="num inline-block [direction:ltr]">{{ time() }}</span>`,
})
export class LastUpdated {
  /** Timestamp (ms) of the last data refresh. */
  readonly at = input.required<number>();

  protected readonly time = computed(() => formatTime12(this.at()));
}
