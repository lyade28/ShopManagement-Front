import { Routes } from '@angular/router';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/settings-index/settings-index.component').then(m => m.SettingsIndexComponent)
  },
  {
    path: 'categories',
    loadComponent: () => import('./components/category-list/category-list.component').then(m => m.CategoryListComponent)
  },
  {
    path: 'categories/create',
    loadComponent: () => import('./components/category-create/category-create.component').then(m => m.CategoryCreateComponent)
  },
  {
    path: 'categories/edit/:id',
    loadComponent: () => import('./components/category-edit/category-edit.component').then(m => m.CategoryEditComponent)
  },
  {
    path: 'categories/:id/attributes',
    loadComponent: () => import('./components/category-attributes/category-attributes.component').then(m => m.CategoryAttributesComponent)
  },
  {
    path: 'audit',
    loadComponent: () => import('./components/audit-trail/audit-trail.component').then(m => m.AuditTrailComponent)
  }
];

