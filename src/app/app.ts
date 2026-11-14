import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  host: { class: 'grid h-dvh grid-cols-[minmax(0,1fr)] bg-page [direction:rtl]' },
  templateUrl: './app.html',
})
export class App {}
