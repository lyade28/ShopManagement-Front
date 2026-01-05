import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InventoryService, StockMovement } from '../../../../core/services/inventory.service';
import { ShopService, Shop } from '../../../../core/services/shop.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-stock-movements',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './stock-movements.component.html',
  styleUrl: './stock-movements.component.css'
})
export class StockMovementsComponent implements OnInit {
  movements: StockMovement[] = [];
  filteredMovements: StockMovement[] = [];
  shops: Shop[] = [];
  selectedShop: number | 'all' = 'all';
  typeFilter: 'all' | 'entry' | 'exit' | 'adjustment' = 'all';
  isLoading = false;
  searchTerm: string = '';

  // Statistiques
  get totalMovements(): number {
    return this.filteredMovements.length;
  }

  get entryCount(): number {
    return this.filteredMovements.filter(m => m.movement_type === 'entry').length;
  }

  get exitCount(): number {
    return this.filteredMovements.filter(m => m.movement_type === 'exit').length;
  }

  get adjustmentCount(): number {
    return this.filteredMovements.filter(m => m.movement_type === 'adjustment').length;
  }

  get totalEntryQuantity(): number {
    return this.filteredMovements
      .filter(m => m.movement_type === 'entry')
      .reduce((sum, m) => sum + (m.quantity > 0 ? m.quantity : 0), 0);
  }

  get totalExitQuantity(): number {
    return this.filteredMovements
      .filter(m => m.movement_type === 'exit')
      .reduce((sum, m) => sum + Math.abs(m.quantity < 0 ? m.quantity : -m.quantity), 0);
  }

  constructor(
    private inventoryService: InventoryService,
    private shopService: ShopService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadShops();
    this.loadMovements();
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

  loadMovements() {
    this.isLoading = true;
    const params: any = {};
    if (this.selectedShop !== 'all') {
      params.shop = this.selectedShop;
    }

    this.inventoryService.getMovementsList(params).subscribe({
      next: (movements) => {
        this.movements = movements;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des mouvements', error);
        this.isLoading = false;
      }
    });
  }

  onShopChange() {
    this.loadMovements();
  }

  onTypeFilterChange() {
    this.applyFilters();
  }

  applyFilters() {
    this.filteredMovements = this.movements.filter(mov => {
      const matchesType = this.typeFilter === 'all' || mov.movement_type === this.typeFilter;
      const matchesSearch = !this.searchTerm || 
        mov.product_name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        mov.reason?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        mov.reference?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        mov.user_name?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      return matchesType && matchesSearch;
    });
  }

  onSearchChange() {
    this.applyFilters();
  }

  getMovementTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'entry': 'Entrée',
      'exit': 'Sortie',
      'adjustment': 'Ajustement'
    };
    return labels[type] || type;
  }

  getMovementTypeClass(type: string): string {
    return `movement-type ${type}`;
  }
}

