import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { InventoryService, Inventory } from '../../../../core/services/inventory.service';
import { AnalyticsService, AnalyticsResponse } from '../../../../core/services/analytics.service';
import { AuthService } from '../../../../core/services/auth.service';

interface StockAlert {
  product_name: string;
  current_stock: number;
  min_quantity: number;
  category: string;
  status: 'low' | 'out';
}

interface CategoryStock {
  category: string;
  total_products: number;
  total_stock: number;
  low_stock_count: number;
}

@Component({
  selector: 'app-stock-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock-analytics.component.html',
  styleUrl: './stock-analytics.component.css'
})
export class StockAnalyticsComponent implements OnInit {
  stockAlerts: StockAlert[] = [];
  categoryStats: CategoryStock[] = [];
  isLoading = false;

  constructor(
    private inventoryService: InventoryService,
    private analyticsService: AnalyticsService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadStockAnalytics();
  }

  loadStockAnalytics() {
    this.isLoading = true;
    const user = this.authService.getCurrentUser();
    const params: any = {};
    
    if (user?.shop) {
      params.shop = user.shop;
    }

    // Charger les produits en stock faible
    this.inventoryService.getLowStock(params.shop).subscribe({
      next: (inventories) => {
        this.stockAlerts = inventories.map(inv => ({
          product_name: inv.product_name || 'Produit',
          current_stock: inv.quantity,
          min_quantity: inv.min_quantity,
          category: inv.product_name || 'Non catégorisé',
          status: inv.quantity === 0 ? 'out' : 'low'
        }));
      },
      error: (error) => {
        console.error('Erreur lors du chargement des alertes de stock', error);
      }
    });

    // Charger les statistiques de stock
    this.analyticsService.getStockValue(params).subscribe({
      next: (data: AnalyticsResponse) => {
        // Traiter les données selon la structure de la réponse
        if (data.top_products) {
          // Grouper par catégorie si possible
          this.categoryStats = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques de stock', error);
        this.isLoading = false;
      }
    });
  }

  getTotalProducts(): number {
    if (this.categoryStats.length === 0) return 0;
    return this.categoryStats.reduce((sum, cat) => sum + cat.total_products, 0);
  }

  getTotalStock(): number {
    if (this.categoryStats.length === 0) return 0;
    return this.categoryStats.reduce((sum, cat) => sum + cat.total_stock, 0);
  }

  getTotalAlerts(): number {
    return this.stockAlerts.length;
  }

  getStatusClass(status: string): string {
    return `alert-badge ${status}`;
  }

  getStatusLabel(status: string): string {
    return status === 'low' ? 'Stock faible' : 'Rupture';
  }
}
