import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter, Subscription } from 'rxjs';
import { InventoryService, Inventory } from '../../../../core/services/inventory.service';
import { ShopService, Shop } from '../../../../core/services/shop.service';
import { ProductService } from '../../../../core/services/product.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CurrencyFormatPipe, PaginationComponent],
  templateUrl: './inventory-list.component.html',
  styleUrl: './inventory-list.component.css'
})
export class InventoryListComponent implements OnInit, OnDestroy {
  inventories: Inventory[] = [];
  filteredInventories: Inventory[] = [];
  displayedInventories: Inventory[] = [];
  shops: Shop[] = [];
  selectedShop: number | 'all' = 'all';
  searchTerm: string = '';
  statusFilter: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' = 'all';
  categoryFilter: string = 'all';
  categories: string[] = [];
  showLowStockOnly = false;
  isLoading = false;
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;
  totalPages: number = 1;
  
  // Statistiques
  totalProducts = 0;
  totalValue = 0;
  lowStockCount = 0;
  outOfStockCount = 0;

  private routerSubscription?: Subscription;

  constructor(
    private router: Router,
    private inventoryService: InventoryService,
    private shopService: ShopService,
    private productService: ProductService,
    private authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadShops();
    this.loadCategories();
    this.loadInventories();
    
    // Filtrer par produit si queryParam présent
    this.activatedRoute.queryParams.subscribe(params => {
      if (params['product']) {
        // Filtrer l'inventaire par produit
        this.searchTerm = '';
        // Le filtre sera appliqué dans applyFilters
      }
    });
    
    // Recharger les données quand on revient sur cette route
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.url === '/inventory' || event.url.startsWith('/inventory?')) {
          this.loadInventories();
        }
      });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  loadCategories() {
    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories.map(cat => cat.name).filter((name, index, self) => self.indexOf(name) === index);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des catégories', error);
      }
    });
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

  loadInventories() {
    this.isLoading = true;
    const params: any = {};
    if (this.selectedShop !== 'all') {
      params.shop = this.selectedShop;
    }
    if (this.showLowStockOnly) {
      params.is_low_stock = true;
    }

    console.log('Chargement des inventaires avec params:', params);

    this.inventoryService.getInventoriesList(params).subscribe({
      next: (inventories) => {
        console.log('Inventaires reçus:', inventories);
        this.inventories = inventories;
        this.applyFilters();
        this.totalItems = this.filteredInventories.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        this.updateDisplayedInventories();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'inventaire', error);
        this.toastService.error('Erreur lors du chargement de l\'inventaire');
        this.isLoading = false;
      }
    });
  }

  onShopChange() {
    this.currentPage = 1;
    this.loadInventories();
  }

  onLowStockToggle() {
    this.currentPage = 1;
    this.loadInventories();
  }

  onSearchChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onStatusFilterChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onCategoryFilterChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters() {
    // Récupérer le filtre produit depuis les queryParams
    const productId = this.activatedRoute.snapshot.queryParams['product'];
    
    this.filteredInventories = this.inventories.filter(inv => {
      // Filtrer par produit si queryParam présent
      if (productId && inv.product !== Number(productId)) {
        return false;
      }
      
      const matchesSearch = 
        inv.product_name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        inv.product_sku?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = this.statusFilter === 'all' || 
        (this.statusFilter === 'low_stock' && inv.is_low_stock) ||
        (this.statusFilter === 'in_stock' && !inv.is_low_stock && inv.quantity > 0) ||
        (this.statusFilter === 'out_of_stock' && inv.quantity === 0);
      
      const matchesCategory = this.categoryFilter === 'all' || 
        inv.product_category === this.categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
    
    // Calculer les statistiques
    this.calculateStats();
    
    // Mettre à jour la pagination
    this.totalItems = this.filteredInventories.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.updateDisplayedInventories();
  }
  
  updateDisplayedInventories() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedInventories = this.filteredInventories.slice(startIndex, endIndex);
  }
  
  onPageChange(page: number) {
    this.currentPage = page;
    this.updateDisplayedInventories();
  }
  
  onPageSizeChange(pageSize: number) {
    this.pageSize = pageSize;
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.updateDisplayedInventories();
  }
  
  calculateStats() {
    this.totalProducts = this.filteredInventories.length;
    this.totalValue = this.filteredInventories.reduce((sum, inv) => {
      const value = (inv.purchase_price || 0) * (inv.quantity || 0);
      return sum + value;
    }, 0);
    this.lowStockCount = this.filteredInventories.filter(inv => inv.is_low_stock && inv.quantity > 0).length;
    this.outOfStockCount = this.filteredInventories.filter(inv => inv.quantity === 0).length;
  }

  getStockStatus(quantity: number, minQuantity: number): 'low' | 'ok' | 'good' {
    if (quantity < minQuantity) return 'low';
    if (quantity < minQuantity * 2) return 'ok';
    return 'good';
  }

  getStockPercentage(item: Inventory): number {
    if (item.min_quantity === 0) return 100;
    return Math.min((item.quantity / (item.min_quantity * 2)) * 100, 100);
  }

  getStatusClass(status: string): string {
    return `status-badge ${status}`;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'in_stock': 'En stock',
      'low_stock': 'Stock faible',
      'out_of_stock': 'Rupture'
    };
    return labels[status] || status;
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  }
}
