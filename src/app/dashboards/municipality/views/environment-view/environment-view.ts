import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-muni-environment-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './environment-view.html',
})
export class EnvironmentView {
}
