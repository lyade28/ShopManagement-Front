import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface RevenueJournal {
  id: number;
  transaction_type: string;
  reference_id: number;
  reference_type: string;
  shop: number;
  shop_name?: string;
  amount: number;
  description: string;
  date: string;
  user?: number;
  user_name?: string;
  created_at?: string;
}

export interface AnalyticsResponse {
  journals?: RevenueJournal[];
  total?: number;
  total_sales?: number;
  total_revenue?: number;
  average_sale?: number;
  top_products?: any[];
  total_value?: number;
  today_revenue?: number;
  today_sales_count?: number;
  low_stock_count?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  constructor(private apiService: ApiService) {}

  getRevenue(params?: any): Observable<AnalyticsResponse> {
    return this.apiService.get<AnalyticsResponse>('analytics/revenue/', params);
  }

  getSales(params?: any): Observable<AnalyticsResponse> {
    return this.apiService.get<AnalyticsResponse>('analytics/sales/', params);
  }

  getProducts(params?: any): Observable<AnalyticsResponse> {
    return this.apiService.get<AnalyticsResponse>('analytics/products/', params);
  }

  getStockValue(params?: any): Observable<AnalyticsResponse> {
    return this.apiService.get<AnalyticsResponse>('analytics/stock_value/', params);
  }

  getDashboard(params?: any): Observable<AnalyticsResponse> {
    return this.apiService.get<AnalyticsResponse>('analytics/dashboard/', params);
  }

  exportReport(params?: any): Observable<Blob> {
    return this.apiService.get<Blob>('analytics/reports-export/', params, 'blob');
  }
}

