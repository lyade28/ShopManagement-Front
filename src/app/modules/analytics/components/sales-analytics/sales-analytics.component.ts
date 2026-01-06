import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter, Subscription } from 'rxjs';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { AnalyticsService, AnalyticsResponse } from '../../../../core/services/analytics.service';
import { ShopService, Shop } from '../../../../core/services/shop.service';
import { AuthService } from '../../../../core/services/auth.service';

interface SalesData {
  date: string;
  amount: number;
  count: number;
}

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
  quantity: number;
}

@Component({
  selector: 'app-sales-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyFormatPipe],
  templateUrl: './sales-analytics.component.html',
  styleUrl: './sales-analytics.component.css'
})
export class SalesAnalyticsComponent implements OnInit, OnDestroy {
  period: 'day' | 'week' | 'month' = 'month';
  shopFilter: 'all' | number = 'all';
  shops: Shop[] = [];
  dailySales: SalesData[] = [];
  topProducts: TopProduct[] = [];
  isLoading = false;

  private routerSubscription?: Subscription;

  constructor(
    private router: Router,
    private analyticsService: AnalyticsService,
    private shopService: ShopService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadShops();
    this.loadAnalytics();
    
    // Recharger les données quand on revient sur cette route
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.url === '/analytics' || event.url.startsWith('/analytics?')) {
          this.loadAnalytics();
        }
      });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  loadShops() {
    this.shopService.getShops().subscribe({
      next: (shops) => {
        this.shops = shops;
        const user = this.authService.getCurrentUser();
        if (user?.shop && shops.find(s => s.id === user.shop)) {
          this.shopFilter = user.shop;
        }
      }
    });
  }

  loadAnalytics() {
    this.isLoading = true;
    const params: any = {
      period: this.period
    };
    
    if (this.shopFilter !== 'all') {
      params.shop = this.shopFilter;
    }

    this.analyticsService.getSales(params).subscribe({
      next: (data: AnalyticsResponse) => {
        // Traiter les données selon la structure de la réponse
        if (data.top_products) {
          this.topProducts = data.top_products.map((p: any) => ({
            name: p.name || p.product__name || p.product_name || 'Produit',
            sales: p.sales_count || p.total_quantity || p.quantity || 0,
            revenue: p.revenue || p.total_revenue || p.total || 0,
            quantity: p.quantity || p.total_quantity || 0
          }));
        } else {
          this.topProducts = [];
        }
        
        // Si les données quotidiennes ne sont pas disponibles, utiliser des données par défaut
        if (!data.journals || data.journals.length === 0) {
          this.dailySales = [];
        } else {
          // Grouper par date si nécessaire
          const salesByDate: { [key: string]: { amount: number, count: number } } = {};
          data.journals.forEach((journal: any) => {
            const date = journal.date || journal.created_at;
            if (date) {
              const dateKey = date.split('T')[0];
              if (!salesByDate[dateKey]) {
                salesByDate[dateKey] = { amount: 0, count: 0 };
              }
              salesByDate[dateKey].amount += journal.amount || 0;
              salesByDate[dateKey].count += 1;
            }
          });
          this.dailySales = Object.entries(salesByDate).map(([date, data]) => ({
            date,
            amount: data.amount,
            count: data.count
          })).sort((a, b) => a.date.localeCompare(b.date));
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des analyses de ventes', error);
        this.dailySales = [];
        this.topProducts = [];
        this.isLoading = false;
      }
    });
  }

  onPeriodChange() {
    this.loadAnalytics();
  }

  onShopChange() {
    this.loadAnalytics();
  }

  getTotalRevenue(): number {
    if (this.dailySales.length === 0) return 0;
    return this.dailySales.reduce((sum, day) => sum + day.amount, 0);
  }

  getTotalSales(): number {
    if (this.dailySales.length === 0) return 0;
    return this.dailySales.reduce((sum, day) => sum + day.count, 0);
  }

  getAverageSale(): number {
    const totalSales = this.getTotalSales();
    if (totalSales === 0) return 0;
    return this.getTotalRevenue() / totalSales;
  }

  getMaxDay(): SalesData | null {
    if (this.dailySales.length === 0) return null;
    return this.dailySales.reduce((max, day) => day.amount > max.amount ? day : max, this.dailySales[0]);
  }

  getChartData(): { labels: string[], amounts: number[] } {
    if (this.dailySales.length === 0) {
      return { labels: [], amounts: [] };
    }
    return {
      labels: this.dailySales.map(d => new Date(d.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })),
      amounts: this.dailySales.map(d => d.amount)
    };
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }
}
