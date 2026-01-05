import { Routes } from '@angular/router';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () => import('./components/user-list/user-list.component').then(m => m.UserListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./components/user-create/user-create.component').then(m => m.UserCreateComponent)
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./components/user-edit/user-edit.component').then(m => m.UserEditComponent)
  },
  {
    path: 'detail/:id',
    loadComponent: () => import('./components/user-detail/user-detail.component').then(m => m.UserDetailComponent)
  }
];

