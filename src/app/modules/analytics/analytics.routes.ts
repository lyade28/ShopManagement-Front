import { Routes } from '@angular/router';

export const ANALYTICS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'revenue',
    loadComponent: () => import('./components/revenue-journal/revenue-journal.component').then(m => m.RevenueJournalComponent)
  },
  {
    path: 'sales',
    loadComponent: () => import('./components/sales-analytics/sales-analytics.component').then(m => m.SalesAnalyticsComponent)
  },
  {
    path: 'stock',
    loadComponent: () => import('./components/stock-analytics/stock-analytics.component').then(m => m.StockAnalyticsComponent)
  },
  {
    path: 'reports',
    loadComponent: () => import('./components/reports/reports.component').then(m => m.ReportsComponent)
  }
];

