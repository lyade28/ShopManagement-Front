import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { CacheService } from './cache.service';
import { PaginatedResponse, PaginationService } from './pagination.service';

export interface SaleSession {
  id: number;
  session_number: string;
  seller: number;
  seller_name?: string;
  shop: number;
  shop_name?: string;
  start_time: string;
  end_time?: string;
  status: 'open' | 'closed' | 'cancelled';
  total_sales: number;
  sales_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SaleItem {
  id?: number;
  product: number;
  product_name?: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  discount: number;
  subtotal: number;
  created_at?: string;
}

export interface Sale {
  id: number;
  sale_number: string;
  session: number;
  session_number?: string;
  seller: number;
  seller_name?: string;
  shop: number;
  shop_name?: string;
  customer_name: string;
  customer_contact?: string;
  sale_date: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: string;
  payment_status: string;
  status: string;
  notes?: string;
  items?: SaleItem[];
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SaleService {
  constructor(
    private apiService: ApiService,
    private cacheService: CacheService,
    private paginationService: PaginationService
  ) {}

  // Sale Sessions avec pagination et cache (nouvelle méthode)
  getSessionsPaginated(params?: any): Observable<PaginatedResponse<SaleSession>> {
    const cacheKey = this.cacheService.generateKey('sessions', params);
    
    return this.cacheService.cacheObservable(
      cacheKey,
      this.apiService.get<any>('sales/sessions/', params).pipe(
        map((response: any) => {
          if (this.paginationService.isPaginated(response)) {
            return response;
          }
          return {
            count: Array.isArray(response) ? response.length : 0,
            next: null,
            previous: null,
            results: Array.isArray(response) ? response : []
          };
        })
      ),
      2 * 60 * 1000 // Cache 2 minutes (données dynamiques)
    );
  }
  
  // Méthode de compatibilité qui retourne un tableau
  getSessions(params?: any): Observable<SaleSession[]> {
    return this.getSessionsPaginated(params).pipe(
      map(response => this.paginationService.extractResults(response))
    );
  }

  getSession(id: number): Observable<SaleSession> {
    return this.apiService.get<SaleSession>(`sales/sessions/${id}/`);
  }

  createSession(shopId: number, sellerId?: number): Observable<SaleSession> {
    const data: any = { shop: shopId };
    if (sellerId) {
      data.seller = sellerId;
    }
    return this.apiService.post<SaleSession>('sales/sessions/', data);
  }

  closeSession(id: number): Observable<SaleSession> {
    return this.apiService.post<SaleSession>(`sales/sessions/${id}/close/`, {});
  }

  getActiveSessions(sellerId?: number): Observable<SaleSession[]> {
    const params = sellerId ? { seller: sellerId } : {};
    return this.apiService.get<SaleSession[]>('sales/sessions/active/', params).pipe(
      map(response => Array.isArray(response) ? response : [])
    );
  }

  // Sales
  getSales(params?: any): Observable<Sale[]> {
    return this.apiService.get<Sale[]>('sales/', params).pipe(
      map((response: any) => Array.isArray(response) ? response : (response.results || []))
    );
  }

  getSale(id: number): Observable<Sale> {
    return this.apiService.get<Sale>(`sales/${id}/`);
  }

  createSale(sale: Partial<Sale>): Observable<Sale> {
    return this.apiService.post<Sale>('sales/', sale);
  }

  updateSale(id: number, sale: Partial<Sale>): Observable<Sale> {
    return this.apiService.put<Sale>(`sales/${id}/`, sale);
  }

  deleteSale(id: number): Observable<void> {
    return this.apiService.delete<void>(`sales/${id}/`);
  }

  getTodaySales(shopId?: number): Observable<Sale[]> {
    const params = shopId ? { shop: shopId } : {};
    return this.apiService.get<Sale[]>('sales/today/', params).pipe(
      map(response => Array.isArray(response) ? response : [])
    );
  }
}

