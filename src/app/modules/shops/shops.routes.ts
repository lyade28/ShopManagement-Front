import { Routes } from '@angular/router';

export const SHOPS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () => import('./components/shop-list/shop-list.component').then(m => m.ShopListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./components/shop-create/shop-create.component').then(m => m.ShopCreateComponent)
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./components/shop-edit/shop-edit.component').then(m => m.ShopEditComponent)
  },
  {
    path: 'detail/:id',
    loadComponent: () => import('./components/shop-detail/shop-detail.component').then(m => m.ShopDetailComponent)
  }
];

