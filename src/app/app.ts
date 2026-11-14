import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from './shared/components/sidebar/sidebar';

@Component({
  imports: [RouterOutlet, Sidebar],
  selector: 'app-root',
  host: { class: 'grid h-dvh grid-cols-[280px_minmax(0,1fr)] bg-page [direction:rtl] max-[900px]:grid-cols-[minmax(0,1fr)] max-[900px]:grid-rows-[auto_minmax(0,1fr)]' },
  templateUrl: './app.html',
})
export class App {}
