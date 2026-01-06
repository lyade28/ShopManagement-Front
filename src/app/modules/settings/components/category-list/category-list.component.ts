import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter, Subscription } from 'rxjs';
import { ProductService, Category } from '../../../../core/services/product.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PaginationComponent],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.css'
})
export class CategoryListComponent implements OnInit, OnDestroy {
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  displayedCategories: Category[] = [];
  searchTerm: string = '';
  isLoading = false;
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;
  totalPages: number = 1;

  private routerSubscription?: Subscription;

  constructor(
    private router: Router,
    private productService: ProductService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  get totalCategories(): number {
    return this.categories.length;
  }

  get activeCategories(): number {
    return this.categories.filter(c => c.is_active !== false).length;
  }

  get categoriesWithProducts(): number {
    return this.categories.filter(c => (c.products_count || 0) > 0).length;
  }

  get totalProducts(): number {
    return this.categories.reduce((sum, c) => sum + (c.products_count || 0), 0);
  }

  ngOnInit() {
    this.loadCategories();
    
    // Recharger les données quand on revient sur cette route
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.url === '/settings/categories' || event.url.startsWith('/settings/categories?')) {
          this.loadCategories();
        }
      });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  loadCategories() {
    this.isLoading = true;
    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.filteredCategories = [...categories];
        this.totalItems = this.filteredCategories.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        this.updateDisplayedCategories();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des catégories', error);
        this.isLoading = false;
      }
    });
  }

  onSearchChange() {
    this.currentPage = 1;
    this.filteredCategories = this.categories.filter(category =>
      category.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    this.totalItems = this.filteredCategories.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.updateDisplayedCategories();
  }
  
  updateDisplayedCategories() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedCategories = this.filteredCategories.slice(startIndex, endIndex);
  }
  
  onPageChange(page: number) {
    this.currentPage = page;
    this.updateDisplayedCategories();
  }
  
  onPageSizeChange(pageSize: number) {
    this.pageSize = pageSize;
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.updateDisplayedCategories();
  }

  deleteCategory(id: number) {
    const category = this.categories.find(c => c.id === id);
    const productsCount = category?.products_count || 0;
    
    let confirmMessage = 'Êtes-vous sûr de vouloir supprimer cette catégorie ?';
    if (productsCount > 0) {
      confirmMessage = `Attention : Cette catégorie est utilisée par ${productsCount} produit(s).\n\nÊtes-vous sûr de vouloir la supprimer ?\n\nNote : Vous devrez d'abord supprimer ou réassigner ces produits.`;
    }
    
    this.confirmationService.confirm({
      title: 'Supprimer la catégorie',
      message: confirmMessage,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: productsCount > 0 ? 'warning' : 'danger'
    }).then(confirmed => {
      if (confirmed) {
        this.isLoading = true;
        this.productService.deleteCategory(id).subscribe({
          next: () => {
            this.isLoading = false;
            this.toastService.success('Catégorie supprimée avec succès !');
            this.loadCategories();
          },
          error: (error) => {
            this.isLoading = false;
            let errorMessage = 'Erreur lors de la suppression de la catégorie';
            
            if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (error.error?.error) {
              errorMessage = error.error.error;
            } else if (error.error?.detail) {
              errorMessage = error.error.detail;
            } else if (error.message) {
              errorMessage = error.message;
            }
            
            this.toastService.error(errorMessage);
            console.error('Erreur suppression catégorie:', error);
          }
        });
      }
    });
  }

  toggleCategoryStatus(category: Category) {
    const newStatus = !category.is_active;
    this.productService.updateCategory(category.id, { is_active: newStatus }).subscribe({
      next: (updatedCategory) => {
        const statusText = updatedCategory.is_active ? 'activée' : 'désactivée';
        this.toastService.success(`Catégorie ${statusText} avec succès !`);
        // Recharger la liste pour avoir les données à jour
        this.loadCategories();
      },
      error: (error) => {
        this.toastService.error('Erreur lors de la mise à jour du statut');
        console.error(error);
      }
    });
  }

  getAttributesCount(category: Category): number {
    return category.attributes?.length || 0;
  }

  getProductsCount(category: Category): number {
    return category.products_count || 0;
  }
}

