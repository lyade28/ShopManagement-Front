import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const apiService = inject(ApiService);
  const token = authService.getAuthToken();

  // Ajouter le token à la requête
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si erreur 401 (non autorisé), essayer de rafraîchir le token
      if (error.status === 401 && token) {
        const refreshToken = authService.getRefreshToken();
        
        if (refreshToken) {
          return apiService.post<{ access: string }>('auth/token/refresh/', { refresh: refreshToken }).pipe(
            switchMap((response) => {
              authService.setAuthToken(response.access);
              
              // Réessayer la requête originale avec le nouveau token
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${response.access}`
                }
              });
              return next(retryReq);
            }),
            catchError((refreshError) => {
              // Si le refresh échoue, déconnecter l'utilisateur
              authService.logout().subscribe();
              router.navigate(['/auth/login']);
              return throwError(() => refreshError);
            })
          );
        }
      }

      // Si erreur 403 (interdit), rediriger vers le dashboard
      if (error.status === 403) {
        router.navigate(['/dashboard']);
      }

      return throwError(() => error);
    })
  );
};

