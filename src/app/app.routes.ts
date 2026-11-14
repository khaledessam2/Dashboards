import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'traffic' },
  {
    path: 'traffic',
    loadComponent: () => import('./dashboards/traffic/traffic-dashboard').then((m) => m.TrafficDashboard),
  },
  {
    path: 'police',
    loadComponent: () => import('./dashboards/police/police-dashboard').then((m) => m.PoliceDashboard),
  },
  {
    path: 'datacenter',
    loadComponent: () => import('./dashboards/datacenter/datacenter-dashboard').then((m) => m.DatacenterDashboard),
  },
  { path: '**', redirectTo: 'traffic' },
];
