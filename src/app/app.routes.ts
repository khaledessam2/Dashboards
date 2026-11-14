import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'traffic' },
  {
    path: 'traffic',
    loadComponent: () => import('./components/traffic-dashboard/traffic-dashboard').then((m) => m.TrafficDashboard),
  },
  { path: '**', redirectTo: 'traffic' },
];
