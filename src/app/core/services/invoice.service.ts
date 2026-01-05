import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface Invoice {
  id: number;
  invoice_number: string;
  sale: number;
  sale_number?: string;
  issue_date: string;
  due_date?: string;
  seller_info?: any;
  customer_name: string;
  customer_info?: any;
  items?: any[];
  subtotal: number;
  tax: number;
  total: number;
  payment_status: string;
  status: string;
  notes?: string;
  pdf_file?: string;
  shop_name?: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  constructor(private apiService: ApiService) {}

  getInvoices(params?: any): Observable<Invoice[]> {
    return this.apiService.get<any>('invoices/', params).pipe(
      map((response: any) => Array.isArray(response) ? response : (response.results || []))
    );
  }

  getInvoice(id: number): Observable<Invoice> {
    return this.apiService.get<Invoice>(`invoices/${id}/`);
  }

  getInvoiceBySale(saleId: number): Observable<Invoice> {
    return this.apiService.get<Invoice>(`invoices/sale/${saleId}/`);
  }

  updateInvoice(id: number, invoice: Partial<Invoice>): Observable<Invoice> {
    return this.apiService.put<Invoice>(`invoices/${id}/`, invoice);
  }

  downloadInvoicePdf(id: number): Observable<Blob> {
    return this.apiService.get<Blob>(`invoices/${id}/pdf/`, undefined, 'blob');
  }
}

