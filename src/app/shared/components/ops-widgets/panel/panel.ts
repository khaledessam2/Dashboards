import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Card with a title row (same look as the existing dashboard cards). Content is projected. */
@Component({
  selector: 'app-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'card gap-3' },
  templateUrl: './panel.html',
})
export class Panel {
  readonly title = input.required<string>();
  readonly icon = input<string>('');
  readonly hint = input<string>('');
}
