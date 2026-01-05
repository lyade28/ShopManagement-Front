import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { SaleService } from '../../../../core/services/sale.service';
import { InventoryService } from '../../../../core/services/inventory.service';
import { AuthService } from '../../../../core/services/auth.service';

interface StatCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: string;
  color: string;
}

interface RecentSale {
  id: number;
  customer: string;
  amount: number;
  date: string;
  status: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyFormatPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  stats: StatCard[] = [];
  recentSales: RecentSale[] = [];
  topProducts: any[] = [];
  isLoading = false;

  constructor(
    private analyticsService: AnalyticsService,
    private saleService: SaleService,
    private inventoryService: InventoryService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isLoading = true;
    const user = this.authService.getCurrentUser();
    const params: any = {};
    
    if (user?.shop) {
      params.shop = user.shop;
    }

    // Charger les données du dashboard
    this.analyticsService.getDashboard(params).subscribe({
      next: (data) => {
        // Mettre à jour les statistiques
        this.stats = [
          {
            title: 'Chiffre d\'affaires',
            value: this.formatCurrency(data.today_revenue || 0),
            change: '+0%',
            trend: 'up',
            icon: 'trending_up',
            color: 'var(--success)'
          },
          {
            title: 'Ventes du jour',
            value: String(data.today_sales_count || 0),
            change: '+0%',
            trend: 'up',
            icon: 'shopping_cart',
            color: 'var(--primary)'
          },
          {
            title: 'Valeur du stock',
            value: this.formatCurrency(data.total_value || 0),
            change: '+0%',
            trend: 'up',
            icon: 'inventory',
            color: 'var(--info)'
          },
          {
            title: 'Alertes stock',
            value: String(data.low_stock_count || 0),
            change: 'Urgent',
            trend: 'down',
            icon: 'warning',
            color: 'var(--warning)'
          }
        ];

        // Charger les produits les plus vendus
        if (data.top_products) {
          this.topProducts = data.top_products;
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du dashboard', error);
        // Utiliser des données par défaut en cas d'erreur
        this.loadDefaultData();
        this.isLoading = false;
      }
    });

    // Charger les ventes récentes
    this.saleService.getSales({ limit: 5, ordering: '-sale_date' }).subscribe({
      next: (sales: any) => {
        const salesList = Array.isArray(sales) ? sales : ((sales as any).results || []);
        this.recentSales = salesList.slice(0, 5).map((sale: any) => ({
          id: sale.id,
          customer: sale.customer_name,
          amount: sale.total,
          date: sale.sale_date,
          status: sale.status
        }));
      },
      error: (error) => {
        console.error('Erreur lors du chargement des ventes récentes', error);
      }
    });

    // Charger la valeur du stock
    this.analyticsService.getStockValue(params).subscribe({
      next: (stockData) => {
        if (stockData.total_value !== undefined) {
          // Mettre à jour la valeur du stock dans les stats
          const stockStat = this.stats.find(s => s.title === 'Valeur du stock');
          if (stockStat) {
            stockStat.value = this.formatCurrency(stockData.total_value);
          }
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la valeur du stock', error);
      }
    });

    // Charger les top produits
    this.analyticsService.getProducts(params).subscribe({
      next: (productsData) => {
        if (productsData.top_products) {
          this.topProducts = productsData.top_products.map((p: any) => ({
            name: p.product__name || p.name || 'Produit',
            sales: p.total_quantity || p.quantity || 0,
            revenue: p.total_revenue || p.revenue || 0
          }));
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des top produits', error);
      }
    });
  }

  loadDefaultData() {
    this.stats = [
      {
        title: 'Chiffre d\'affaires',
        value: '0',
        change: '0%',
        trend: 'up',
        icon: 'trending_up',
        color: 'var(--success)'
      },
      {
        title: 'Ventes du jour',
        value: '0',
        change: '0%',
        trend: 'up',
        icon: 'shopping_cart',
        color: 'var(--primary)'
      },
      {
        title: 'Produits en stock',
        value: '0',
        change: '0%',
        trend: 'up',
        icon: 'inventory',
        color: 'var(--info)'
      },
      {
        title: 'Alertes stock',
        value: '0',
        change: 'Aucune',
        trend: 'up',
        icon: 'warning',
        color: 'var(--warning)'
      }
    ];
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(value).replace('XOF', 'FCFA');
  }
}
