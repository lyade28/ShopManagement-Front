import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter, Subscription } from 'rxjs';
import { ShopService, Shop } from '../../../../core/services/shop.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-shop-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PaginationComponent],
  templateUrl: './shop-list.component.html',
  styleUrl: './shop-list.component.css'
})
export class ShopListComponent implements OnInit, OnDestroy {
  shops: Shop[] = [];
  filteredShops: Shop[] = [];
  displayedShops: Shop[] = [];
  searchTerm: string = '';
  isLoading = false;
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;
  totalPages: number = 1;

  private routerSubscription?: Subscription;

  // Statistiques
  get totalShops(): number {
    return this.shops.length;
  }

  get activeShops(): number {
    return this.shops.filter(s => s.is_active !== false).length;
  }

  get inactiveShops(): number {
    return this.shops.filter(s => s.is_active === false).length;
  }

  constructor(
    private router: Router,
    private shopService: ShopService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadShops();
    
    // Recharger les données quand on revient sur cette route
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.url === '/shops' || event.url.startsWith('/shops?')) {
          this.loadShops();
        }
      });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  loadShops() {
    this.isLoading = true;
    this.shopService.getShops().subscribe({
      next: (shops) => {
        this.shops = shops;
        this.filteredShops = [...shops];
        this.totalItems = this.filteredShops.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        this.updateDisplayedShops();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des boutiques', error);
        this.isLoading = false;
      }
    });
  }

  onSearchChange() {
    this.currentPage = 1;
    this.filteredShops = this.shops.filter(shop =>
      shop.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      shop.address?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      shop.phone?.includes(this.searchTerm)
    );
    this.totalItems = this.filteredShops.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.updateDisplayedShops();
  }
  
  updateDisplayedShops() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedShops = this.filteredShops.slice(startIndex, endIndex);
  }
  
  onPageChange(page: number) {
    this.currentPage = page;
    this.updateDisplayedShops();
  }
  
  onPageSizeChange(pageSize: number) {
    this.pageSize = pageSize;
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.updateDisplayedShops();
  }

  deleteShop(id: number) {
    this.confirmationService.confirm({
      title: 'Supprimer la boutique',
      message: 'Êtes-vous sûr de vouloir supprimer cette boutique ?',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger'
    }).then(confirmed => {
      if (confirmed) {
        this.shopService.deleteShop(id).subscribe({
          next: () => {
            this.toastService.success('Boutique supprimée avec succès');
            this.loadShops();
          },
          error: (error) => {
            this.toastService.error('Erreur lors de la suppression');
            console.error(error);
          }
        });
      }
    });
  }

  toggleShopStatus(shop: Shop) {
    this.shopService.updateShop(shop.id, { is_active: !shop.is_active }).subscribe({
      next: () => {
        this.toastService.success(`Boutique ${!shop.is_active ? 'activée' : 'désactivée'} avec succès`);
        // Recharger la liste pour avoir les données à jour
        this.loadShops();
      },
      error: (error) => {
        this.toastService.error('Erreur lors de la mise à jour du statut');
        console.error(error);
      }
    });
  }
}
