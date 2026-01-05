import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { ProductService, Product } from '../../../../core/services/product.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyFormatPipe],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  productId!: number;
  isLoading = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.productId = +this.route.snapshot.paramMap.get('id')!;
    this.loadProduct();
  }

  loadProduct() {
    this.isLoading = true;
    this.productService.getProduct(this.productId).subscribe({
      next: (product) => {
        this.product = product;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Produit non trouvé';
        this.isLoading = false;
        console.error(error);
      }
    });
  }

  getCategoryName(): string {
    if (!this.product) return 'Non définie';
    
    // Si category_name est disponible, l'utiliser
    if (this.product.category_name) {
      return this.product.category_name;
    }
    
    // Si category est un objet avec name
    if (this.product.category && typeof this.product.category === 'object' && 'name' in this.product.category) {
      return (this.product.category as any).name;
    }
    
    // Sinon, retourner par défaut
    return 'Non définie';
  }

  hasAttributes(): boolean {
    return this.product?.attributes && Object.keys(this.product.attributes).length > 0;
  }

  getAttributeKeys(): string[] {
    if (!this.product?.attributes) return [];
    return Object.keys(this.product.attributes).filter(key => this.product?.attributes[key]);
  }

  getAttributeLabel(key: string): string {
    const labels: { [key: string]: string } = {
      'fabric_type': 'Type de tissu',
      'color': 'Couleur',
      'width': 'Largeur',
      'composition': 'Composition',
      'size': 'Taille',
      'type': 'Type',
      'material': 'Matériau',
      'elasticity': 'Élasticité'
    };
    return labels[key] || key;
  }

  getStockStatus(stock: number, minQuantity: number): 'low' | 'ok' | 'good' {
    if (stock < minQuantity) return 'low';
    if (stock < minQuantity * 2) return 'ok';
    return 'good';
  }

  deleteProduct() {
    this.confirmationService.confirm({
      title: 'Supprimer le produit',
      message: 'Êtes-vous sûr de vouloir supprimer ce produit ?',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger'
    }).then(confirmed => {
      if (confirmed) {
        this.productService.deleteProduct(this.productId).subscribe({
          next: () => {
            this.toastService.success('Produit supprimé avec succès !');
            this.router.navigate(['/products']);
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
