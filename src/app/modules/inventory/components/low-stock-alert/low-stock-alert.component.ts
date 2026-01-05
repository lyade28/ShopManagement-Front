import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InventoryService, Inventory } from '../../../../core/services/inventory.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-low-stock-alert',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './low-stock-alert.component.html',
  styleUrl: './low-stock-alert.component.css'
})
export class LowStockAlertComponent implements OnInit {
  lowStockItems: Inventory[] = [];
  outOfStockItems: Inventory[] = [];
  isLoading = false;

  constructor(
    private inventoryService: InventoryService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadLowStockAlerts();
  }

  loadLowStockAlerts() {
    this.isLoading = true;
    const user = this.authService.getCurrentUser();
    const params: any = { low_stock: true };

    if (user?.shop && user.role === 'seller') {
      params.shop = user.shop;
    }

    this.inventoryService.getInventoriesList(params).subscribe({
      next: (inventories) => {
        this.lowStockItems = inventories.filter((inv: any) => 
          inv.quantity > 0 && inv.quantity <= (inv.min_quantity || 0)
        );
        this.outOfStockItems = inventories.filter((inv: any) => inv.quantity === 0);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des alertes', error);
        this.isLoading = false;
      }
    });
  }

  getStockPercentage(item: Inventory): number {
    if (!item.min_quantity || item.min_quantity === 0) return 0;
    return Math.min((item.quantity / item.min_quantity) * 100, 100);
  }

  getStatusClass(item: Inventory): string {
    if (item.quantity === 0) return 'status-out';
    if (item.quantity <= (item.min_quantity || 0)) return 'status-low';
    return 'status-ok';
  }

  getStatusLabel(item: Inventory): string {
    if (item.quantity === 0) return 'Rupture de stock';
    if (item.quantity <= (item.min_quantity || 0)) return 'Stock faible';
    return 'En stock';
  }
}
