import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'products',
    canActivate: [authGuard],
    loadChildren: () => import('./modules/products/products.routes').then(m => m.PRODUCTS_ROUTES)
  },
  {
    path: 'shops',
    canActivate: [authGuard, roleGuard(['admin'])],
    loadChildren: () => import('./modules/shops/shops.routes').then(m => m.SHOPS_ROUTES)
  },
  {
    path: 'inventory',
    canActivate: [authGuard],
    loadChildren: () => import('./modules/inventory/inventory.routes').then(m => m.INVENTORY_ROUTES)
  },
  {
    path: 'sales',
    canActivate: [authGuard],
    loadChildren: () => import('./modules/sales/sales.routes').then(m => m.SALES_ROUTES)
  },
  {
    path: 'invoices',
    canActivate: [authGuard],
    loadChildren: () => import('./modules/invoices/invoices.routes').then(m => m.INVOICES_ROUTES)
  },
  {
    path: 'analytics',
    canActivate: [authGuard],
    loadChildren: () => import('./modules/analytics/analytics.routes').then(m => m.ANALYTICS_ROUTES)
  },
  {
    path: 'settings',
    canActivate: [authGuard, roleGuard(['admin'])],
    loadChildren: () => import('./modules/settings/settings.routes').then(m => m.SETTINGS_ROUTES)
  },
  {
    path: 'users',
    canActivate: [authGuard, roleGuard(['admin'])],
    loadChildren: () => import('./modules/users/users.routes').then(m => m.USERS_ROUTES)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () => import('./modules/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
