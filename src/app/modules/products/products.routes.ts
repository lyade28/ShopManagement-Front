import { Routes } from '@angular/router';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () => import('./components/product-list/product-list.component').then(m => m.ProductListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./components/product-create/product-create.component').then(m => m.ProductCreateComponent)
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./components/product-edit/product-edit.component').then(m => m.ProductEditComponent)
  },
  {
    path: 'detail/:id',
    loadComponent: () => import('./components/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
  }
];

