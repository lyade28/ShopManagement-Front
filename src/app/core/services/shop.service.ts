import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface Shop {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  sellers_count?: number;
  sellers?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  constructor(private apiService: ApiService) {}

  getShops(): Observable<Shop[]> {
    return this.apiService.get<Shop[]>('shops/').pipe(
      map((response: any) => Array.isArray(response) ? response : (response.results || []))
    );
  }

  getShop(id: number): Observable<Shop> {
    return this.apiService.get<Shop>(`shops/${id}/`);
  }

  createShop(shop: Partial<Shop>): Observable<Shop> {
    return this.apiService.post<Shop>('shops/', shop);
  }

  updateShop(id: number, shop: Partial<Shop>): Observable<Shop> {
    return this.apiService.put<Shop>(`shops/${id}/`, shop);
  }

  deleteShop(id: number): Observable<void> {
    return this.apiService.delete<void>(`shops/${id}/`);
  }

  getShopSellers(shopId: number): Observable<any[]> {
    return this.apiService.get<any[]>(`shops/${shopId}/sellers/`).pipe(
      map(response => Array.isArray(response) ? response : [])
    );
  }
}

