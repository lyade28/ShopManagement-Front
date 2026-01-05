import { Routes } from '@angular/router';

export const SALES_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'sessions',
    pathMatch: 'full'
  },
  {
    path: 'sessions',
    loadComponent: () => import('./components/sale-session-list/sale-session-list.component').then(m => m.SaleSessionListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./components/sale-session-create/sale-session-create.component').then(m => m.SaleSessionCreateComponent)
  },
  {
    path: 'sell/:id',
    loadComponent: () => import('./components/sale-process/sale-process.component').then(m => m.SaleProcessComponent)
  },
  {
    path: 'detail/:id',
    loadComponent: () => import('./components/sale-session-detail/sale-session-detail.component').then(m => m.SaleSessionDetailComponent)
  }
];

