import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService, Product, Category } from '../../../../core/services/product.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-product-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-edit.component.html',
  styleUrl: './product-edit.component.css'
})
export class ProductEditComponent implements OnInit {
  product: Partial<Product> = {};
  productId!: number;
  categories: Category[] = [];
  units = [
    { value: 'piece', label: 'Pièce' },
    { value: 'metre', label: 'Mètre' },
    { value: 'kg', label: 'Kilogramme' },
    { value: 'litre', label: 'Litre' },
    { value: 'paquet', label: 'Paquet' },
    { value: 'lot', label: 'Lot' }
  ];
  categoryAttributes: { [key: number]: any[] } = {};
  selectedCategoryAttributes: any[] = [];
  quantity: number = 0;
  minQuantity: number = 0;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.productId = +this.route.snapshot.paramMap.get('id')!;
    this.loadProduct();
    this.loadCategories();
  }

  loadProduct() {
    this.isLoading = true;
    this.productService.getProduct(this.productId).subscribe({
      next: (product) => {
        this.product = { ...product };
        if (product.category && typeof product.category === 'object') {
          this.product.category = (product.category as any).id;
        }
        this.onCategoryChange();
        this.isLoading = false;
      },
      error: (error) => {
        this.toastService.error('Erreur lors du chargement du produit');
        console.error(error);
        this.router.navigate(['/products']);
      }
    });
  }

  loadCategories() {
    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        categories.forEach(cat => {
          if (cat.attributes && cat.attributes.length > 0) {
            this.categoryAttributes[cat.id] = cat.attributes;
          } else {
            // Charger les attributs depuis l'API si non inclus dans la réponse
            this.productService.getCategoryAttributes(cat.id).subscribe({
              next: (attributes) => {
                this.categoryAttributes[cat.id] = attributes;
              },
              error: () => {
                this.categoryAttributes[cat.id] = [];
              }
            });
          }
        });
      }
    });
  }

  onCategoryChange() {
    if (this.product.category) {
      const categoryId = typeof this.product.category === 'number' 
        ? this.product.category 
        : (typeof this.product.category === 'string' 
          ? this.categories.find(c => c.name === String(this.product.category))?.id || 0
          : 0);
      
      this.selectedCategoryAttributes = this.categoryAttributes[categoryId] || [];
    }
  }

  getAttributesForCategory(): any[] {
    if (!this.product.category) return [];
    const categoryId = typeof this.product.category === 'number' 
      ? this.product.category 
      : (typeof this.product.category === 'string' 
        ? this.categories.find(c => c.name === String(this.product.category))?.id || 0
        : 0);
    return this.categoryAttributes[categoryId] || [];
  }

  getAttributeValue(attrName: string): any {
    return this.product.attributes?.[attrName] || '';
  }

  setAttributeValue(attrName: string, value: any) {
    if (!this.product.attributes) {
      this.product.attributes = {};
    }
    this.product.attributes[attrName] = value;
  }

  onSubmit() {
    if (this.isFormValid()) {
      this.isLoading = true;
      this.productService.updateProduct(this.productId, this.product).subscribe({
        next: () => {
          this.toastService.success('Produit mis à jour avec succès !');
          this.isLoading = false;
          this.router.navigate(['/products']);
        },
        error: (error) => {
          this.toastService.error('Erreur lors de la mise à jour du produit');
          console.error(error);
          this.isLoading = false;
        }
      });
    }
  }

  isFormValid(): boolean {
    return !!(
      this.product.name &&
      this.product.category &&
      this.product.purchase_price! > 0 &&
      this.product.selling_price! > 0
    );
  }

  cancel() {
    this.router.navigate(['/products']);
  }
}
