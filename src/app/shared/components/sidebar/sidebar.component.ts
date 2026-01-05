import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { InventoryService } from '../../../core/services/inventory.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  private subscriptions = new Subscription();

  menuItems: MenuItem[] = [
    { label: 'Tableau de bord', icon: 'bi bi-speedometer2', route: '/dashboard' },
    { label: 'Produits', icon: 'bi bi-box-seam', route: '/products' },
    { label: 'Boutiques', icon: 'bi bi-shop', route: '/shops' },
    { label: 'Stock', icon: 'bi bi-archive', route: '/inventory' },
    { label: 'Ventes', icon: 'bi bi-cart-check', route: '/sales' },
    { label: 'Factures', icon: 'bi bi-receipt', route: '/invoices' },
    { label: 'Analyses', icon: 'bi bi-graph-up', route: '/analytics' },
    { label: 'Utilisateurs', icon: 'bi bi-people', route: '/users' },
    { label: 'Paramètres', icon: 'bi bi-gear', route: '/settings' }
  ];

  constructor(
    private router: Router,
    private inventoryService: InventoryService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadLowStockCount();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  loadLowStockCount() {
    const user = this.authService.getCurrentUser();
    const shopId = user?.shop;
    
    const sub = this.inventoryService.getLowStock(shopId).subscribe({
      next: (inventories) => {
        const count = inventories.length;
        const inventoryItem = this.menuItems.find(item => item.route === '/inventory');
        if (inventoryItem) {
          inventoryItem.badge = count > 0 ? count : undefined;
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement du stock faible:', error);
      }
    });
    
    this.subscriptions.add(sub);
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  isActiveRoute(route: string): boolean {
    return this.router.url.startsWith(route);
  }
}
