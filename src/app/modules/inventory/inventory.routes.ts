import { Routes } from '@angular/router';

export const INVENTORY_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () => import('./components/inventory-list/inventory-list.component').then(m => m.InventoryListComponent)
  },
  {
    path: 'detail/:id',
    loadComponent: () => import('./components/inventory-detail/inventory-detail.component').then(m => m.InventoryDetailComponent)
  },
  {
    path: 'adjust/:id',
    loadComponent: () => import('./components/inventory-adjust/inventory-adjust.component').then(m => m.InventoryAdjustComponent)
  },
  {
    path: 'low-stock',
    loadComponent: () => import('./components/low-stock-alert/low-stock-alert.component').then(m => m.LowStockAlertComponent)
  },
  {
    path: 'movements',
    loadComponent: () => import('./components/stock-movements/stock-movements.component').then(m => m.StockMovementsComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./components/inventory-create/inventory-create.component').then(m => m.InventoryCreateComponent)
  }
];

