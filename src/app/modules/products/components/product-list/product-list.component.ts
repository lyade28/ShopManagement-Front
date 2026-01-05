import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { ProductService, Product, Category } from '../../../../core/services/product.service';
import { PaginationService } from '../../../../core/services/pagination.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CurrencyFormatPipe, PaginationComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];
  searchTerm: string = '';
  selectedCategory: string | number = 'all';
  isLoading = false;
  errorMessage = '';
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;
  totalPages: number = 1;

  constructor(
    private productService: ProductService,
    private paginationService: PaginationService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadProducts();
    this.loadCategories();
  }

  loadProducts(page: number = 1) {
    this.isLoading = true;
    const params = this.paginationService.createParams(page, this.pageSize);
    
    // Ajouter les filtres si nécessaire
    if (this.searchTerm) {
      params.search = this.searchTerm;
    }
    if (this.selectedCategory !== 'all' && this.selectedCategory !== null && this.selectedCategory !== undefined) {
      // S'assurer qu'on envoie toujours un ID numérique
      const categoryId = typeof this.selectedCategory === 'object' && this.selectedCategory !== null 
        ? (this.selectedCategory as any).id 
        : this.selectedCategory;
      if (categoryId) {
        params.category = Number(categoryId);
      }
    }
    
    this.productService.getProducts(params).subscribe({
      next: (response) => {
        this.products = this.paginationService.extractResults(response);
        this.filteredProducts = [...this.products];
        this.totalItems = response.count || this.products.length;
        this.totalPages = this.paginationService.getTotalPages(this.totalItems, this.pageSize);
        this.currentPage = page;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du chargement des produits';
        this.isLoading = false;
        console.error(error);
      }
    });
  }

  loadCategories() {
    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des catégories', error);
      }
    });
  }

  onSearchChange() {
    this.currentPage = 1;
    this.loadProducts(1);
  }

  onCategoryChange() {
    this.currentPage = 1;
    this.loadProducts(1);
  }

  applyFilters() {
    // Les filtres sont maintenant gérés côté serveur via loadProducts
    // Cette méthode peut être utilisée pour des filtres côté client si nécessaire
  }
  
  onPageChange(page: number) {
    this.currentPage = page;
    this.loadProducts(page);
  }
  
  onPageSizeChange(pageSize: number) {
    this.pageSize = pageSize;
    this.currentPage = 1;
    this.loadProducts(1);
  }

  getStockStatus(product: Product): 'low' | 'ok' | 'good' {
    // Note: Le stock n'est pas dans Product, il est dans Inventory
    // Pour l'instant, on retourne 'good' par défaut
    return 'good';
  }

  getProductStatus(product: Product): string {
    return product.is_active ? 'Actif' : 'Inactif';
  }

  deleteProduct(id: number) {
    this.confirmationService.confirm({
      title: 'Supprimer le produit',
      message: 'Êtes-vous sûr de vouloir supprimer ce produit ?',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger'
    }).then(confirmed => {
      if (confirmed) {
        this.productService.deleteProduct(id).subscribe({
          next: () => {
            this.toastService.success('Produit supprimé avec succès !');
            this.loadProducts(this.currentPage);
          },
          error: (error) => {
            const errorMessage = error.error?.message || error.error?.error || 'Erreur lors de la suppression du produit';
            this.toastService.error(errorMessage);
            console.error(error);
          }
        });
      }
    });
  }
}
