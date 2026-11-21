import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-muni-roads-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './roads-view.html',
})
export class RoadsView {
}
