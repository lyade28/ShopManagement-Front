import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AuditLog {
  id: number;
  user?: number;
  user_name?: string;
  action: 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout';
  action_display: string;
  model_name: string;
  object_id?: number;
  object_repr: string;
  changes: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AuditStats {
  total_actions: number;
  by_action: { [key: string]: number };
  by_model: { [key: string]: number };
  by_user: { [key: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  constructor(private apiService: ApiService) {}

  getAuditLogs(params?: any): Observable<any> {
    return this.apiService.get<any>('audit/', params);
  }

  getAuditLog(id: number): Observable<AuditLog> {
    return this.apiService.get<AuditLog>(`audit/${id}/`);
  }

  getStats(params?: any): Observable<AuditStats> {
    return this.apiService.get<AuditStats>('audit/stats/', params);
  }
}

