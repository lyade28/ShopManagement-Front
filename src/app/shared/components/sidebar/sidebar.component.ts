import { Component, OnInit, OnDestroy, effect } from '@angular/core';
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
  allowedRoles?: ('admin' | 'seller')[]; // Rôles autorisés à voir ce module
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
  currentUser: any = null;

  menuItems: MenuItem[] = [
    { label: 'Tableau de bord', icon: 'bi bi-speedometer2', route: '/dashboard', allowedRoles: ['admin', 'seller'] },
    { label: 'Produits', icon: 'bi bi-box-seam', route: '/products', allowedRoles: ['admin', 'seller'] },
    { label: 'Boutiques', icon: 'bi bi-shop', route: '/shops', allowedRoles: ['admin'] },
    { label: 'Stock', icon: 'bi bi-archive', route: '/inventory', allowedRoles: ['admin', 'seller'] },
    { label: 'Ventes', icon: 'bi bi-cart-check', route: '/sales', allowedRoles: ['admin', 'seller'] },
    { label: 'Factures', icon: 'bi bi-receipt', route: '/invoices', allowedRoles: ['admin', 'seller'] },
    { label: 'Analyses', icon: 'bi bi-graph-up', route: '/analytics', allowedRoles: ['admin', 'seller'] },
    { label: 'Utilisateurs', icon: 'bi bi-people', route: '/users', allowedRoles: ['admin'] },
    { label: 'Paramètres', icon: 'bi bi-gear', route: '/settings', allowedRoles: ['admin'] }
  ];

  filteredMenuItems: MenuItem[] = [];

  constructor(
    private router: Router,
    private inventoryService: InventoryService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.filterMenuItemsByRole();
    this.loadLowStockCount();

    // Écouter les changements d'utilisateur avec effect (pour les signals)
    effect(() => {
      this.currentUser = this.authService.currentUser();
      this.filterMenuItemsByRole();
    });
  }

  filterMenuItemsByRole() {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.filteredMenuItems = [];
      return;
    }

    // Filtrer les modules selon le rôle de l'utilisateur
    this.filteredMenuItems = this.menuItems.filter(item => {
      // Si aucun rôle spécifié, accessible à tous les utilisateurs authentifiés
      if (!item.allowedRoles || item.allowedRoles.length === 0) {
        return true;
      }
      // Vérifier si le rôle de l'utilisateur est dans la liste des rôles autorisés
      return item.allowedRoles.includes(user.role);
    });
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
        const inventoryItem = this.filteredMenuItems.find(item => item.route === '/inventory');
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
