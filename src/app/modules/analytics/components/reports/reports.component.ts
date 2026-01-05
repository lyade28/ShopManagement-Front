import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { ShopService, Shop } from '../../../../core/services/shop.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ExportService, ExportFormat } from '../../../../core/services/export.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  reportType: 'sales' | 'stock' | 'revenue' = 'sales';
  reportTypeMap: { [key: string]: 'sales' | 'inventory' | 'revenue' } = {
    'sales': 'sales',
    'stock': 'inventory',
    'revenue': 'revenue'
  };
  dateRange: 'day' | 'week' | 'month' | 'custom' = 'month';
  startDate: string = '';
  endDate: string = '';
  shops: Shop[] = [];
  selectedShop: 'all' | number = 'all';
  isLoading = false;

  constructor(
    private analyticsService: AnalyticsService,
    private shopService: ShopService,
    private authService: AuthService,
    private exportService: ExportService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadShops();
    this.setDefaultDates();
  }

  loadShops() {
    this.shopService.getShops().subscribe({
      next: (shops) => {
        this.shops = shops;
        const user = this.authService.getCurrentUser();
        if (user?.shop && shops.find(s => s.id === user.shop)) {
          this.selectedShop = user.shop;
        }
      }
    });
  }

  setDefaultDates() {
    const today = new Date();
    this.endDate = today.toISOString().split('T')[0];
    
    if (this.dateRange === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      this.startDate = monthAgo.toISOString().split('T')[0];
    } else if (this.dateRange === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      this.startDate = weekAgo.toISOString().split('T')[0];
    } else if (this.dateRange === 'day') {
      this.startDate = this.endDate;
    }
  }

  onDateRangeChange() {
    this.setDefaultDates();
  }

  generateReport() {
    this.isLoading = true;
    const params: any = {
      type: this.reportType,
      start_date: this.startDate,
      end_date: this.endDate
    };
    
    if (this.selectedShop !== 'all') {
      params.shop = this.selectedShop;
    }

    // Appel à l'API pour générer le rapport
    // Note: L'endpoint exact dépend de l'implémentation backend
    this.analyticsService.getDashboard(params).subscribe({
      next: (data) => {
        this.toastService.success('Rapport généré avec succès !');
        this.isLoading = false;
        // Ici, vous pourriez afficher les données du rapport
      },
      error: (error) => {
        this.toastService.error('Erreur lors de la génération du rapport');
        console.error(error);
        this.isLoading = false;
      }
    });
  }

  exportReport(format: ExportFormat) {
    this.isLoading = true;
    this.toastService.info('Export en cours...');
    
    const reportType: 'sales' | 'inventory' | 'revenue' = this.reportTypeMap[this.reportType] || 'sales';
    
    const params = {
      report_type: reportType,
      format: format,
      start_date: this.startDate,
      end_date: this.endDate,
      shop: this.selectedShop !== 'all' ? this.selectedShop : undefined
    };

    try {
      this.exportService.downloadReport(params);
      this.toastService.success(`Rapport exporté en ${format.toUpperCase()} avec succès !`);
      this.isLoading = false;
    } catch (error) {
      console.error('Erreur lors de l\'export', error);
      this.toastService.error('Erreur lors de l\'export du rapport');
      this.isLoading = false;
    }
  }
}
