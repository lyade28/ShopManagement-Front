import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type ExportFormat = 'excel' | 'csv';
export type ReportType = 'sales' | 'inventory' | 'revenue';

export interface ExportParams {
  report_type: ReportType;
  format: ExportFormat;
  start_date?: string;
  end_date?: string;
  shop?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  constructor(private apiService: ApiService) {}

  exportReport(params: ExportParams): Observable<Blob> {
    const queryParams: any = {
      report_type: params.report_type,
      format: params.format
    };

    if (params.start_date) {
      queryParams.start_date = params.start_date;
    }
    if (params.end_date) {
      queryParams.end_date = params.end_date;
    }
    if (params.shop) {
      queryParams.shop = params.shop;
    }

    return this.apiService.get<Blob>('analytics/reports-export/', queryParams, 'blob').pipe(
      map(blob => blob)
    );
  }

  downloadReport(params: ExportParams): void {
    this.exportReport(params).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const extension = params.format === 'excel' ? 'xlsx' : 'csv';
        const filename = `rapport_${params.report_type}_${new Date().toISOString().split('T')[0]}.${extension}`;
        link.download = filename;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Erreur lors de l\'export:', error);
        throw error;
      }
    });
  }
}

