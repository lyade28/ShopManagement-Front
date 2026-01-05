import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError } from 'rxjs';
import { ApiService } from './api.service';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'seller';
  first_name: string;
  last_name: string;
  shop_id?: number;
  shop?: number;
  shop_name?: string;
  phone?: string;
  is_active?: boolean;
  date_joined?: string;
  last_login?: string;
  created_at?: string;
  total_sales?: number;
  total_revenue?: number;
}

export interface LoginResponse {
  refresh: string;
  access: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'current_user';

  isAuthenticated = signal<boolean>(false);
  currentUser = signal<User | null>(null);

  constructor(
    private router: Router,
    private apiService: ApiService
  ) {
    this.checkAuthStatus();
  }

  checkAuthStatus(): void {
    const token = this.getAuthToken();
    const user = this.getCurrentUser();
    
    if (token && user) {
      this.isAuthenticated.set(true);
      this.currentUser.set(user);
    } else {
      this.isAuthenticated.set(false);
      this.currentUser.set(null);
    }
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.apiService.post<LoginResponse>('auth/login/', { username, password }).pipe(
      tap(response => {
        this.setAuthToken(response.access);
        this.setRefreshToken(response.refresh);
        this.setCurrentUser(response.user);
      })
    );
  }

  logout(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      return this.apiService.post('auth/logout/', { refresh: refreshToken }).pipe(
        tap(() => {
          this.clearAuth();
        }),
        catchError((error) => {
          // Même si l'API échoue, nettoyer localement
          console.warn('Erreur lors de la déconnexion côté serveur, nettoyage local effectué:', error);
          this.clearAuth();
          return new Observable(observer => {
            observer.next({});
            observer.complete();
          });
        })
      );
    }
    // Si pas de refresh token, nettoyer directement
    this.clearAuth();
    return new Observable(observer => {
      observer.next({});
      observer.complete();
    });
  }

  getCurrentUserFromApi(): Observable<User> {
    return this.apiService.get<User>('auth/user/').pipe(
      tap(user => {
        this.setCurrentUser(user);
      })
    );
  }

  updateCurrentUser(userData: Partial<User>): Observable<User> {
    return this.apiService.put<User>('auth/user/', userData).pipe(
      tap(user => {
        this.setCurrentUser(user);
      })
    );
  }

  register(userData: any): Observable<User> {
    return this.apiService.post<User>('auth/users/', userData).pipe(
      tap(user => {
        this.setCurrentUser(user);
      })
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.apiService.post('auth/password-reset/', { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.apiService.post('auth/password-reset/confirm/', { token, new_password: newPassword });
  }

  private clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  setAuthToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.isAuthenticated.set(true);
  }

  getAuthToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setCurrentUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  hasRole(role: 'admin' | 'seller'): boolean {
    const user = this.currentUser();
    return user?.role === role;
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  isSeller(): boolean {
    return this.hasRole('seller');
  }
}
