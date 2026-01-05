import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { User } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private apiService: ApiService) {}

  getUsers(params?: any): Observable<User[]> {
    return this.apiService.get<User[]>('auth/users/', params).pipe(
      map((response: any) => Array.isArray(response) ? response : (response.results || []))
    );
  }

  getUser(id: number): Observable<User> {
    return this.apiService.get<User>(`auth/users/${id}/`);
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.apiService.post<User>('auth/users/', user);
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.apiService.put<User>(`auth/users/${id}/`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.apiService.delete<void>(`auth/users/${id}/`);
  }
}

