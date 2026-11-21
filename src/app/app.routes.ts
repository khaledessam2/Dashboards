import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'traffic' },
  {
    path: 'traffic',
    loadComponent: () => import('./dashboards/traffic/traffic-dashboard/traffic-dashboard').then((m) => m.TrafficDashboard),
  },
  {
    path: 'police',
    loadComponent: () => import('./dashboards/police/police-dashboard/police-dashboard').then((m) => m.PoliceDashboard),
  },
  {
    path: 'datacenter',
    loadComponent: () => import('./dashboards/datacenter/datacenter-dashboard/datacenter-dashboard').then((m) => m.DatacenterDashboard),
  },
  {
    path: 'municipality',
    loadComponent: () => import('./dashboards/municipality/municipality-dashboard/municipality-dashboard').then((m) => m.MunicipalityDashboard),
  },
  {
    path: 'general-dashboard',
    loadComponent: () => import('./dashboards/executive/executive-dashboard/executive-dashboard').then((m) => m.ExecutiveDashboard),
  },
  { path: '**', redirectTo: 'traffic' },
];
