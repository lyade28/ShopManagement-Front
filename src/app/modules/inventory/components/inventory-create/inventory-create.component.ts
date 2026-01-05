import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InventoryService, Inventory } from '../../../../core/services/inventory.service';
import { ProductService, Product } from '../../../../core/services/product.service';
import { ShopService, Shop } from '../../../../core/services/shop.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-inventory-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory-create.component.html',
  styleUrl: './inventory-create.component.css'
})
export class InventoryCreateComponent implements OnInit {
  inventory: Partial<Inventory> = {
    product: 0,
    shop: 0,
    quantity: 0,
    min_quantity: 0,
    location: ''
  };

  products: Product[] = [];
  shops: Shop[] = [];
  isLoading = false;

  constructor(
    private router: Router,
    private inventoryService: InventoryService,
    private productService: ProductService,
    private shopService: ShopService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadProducts();
    this.loadShops();
  }

  loadProducts() {
    this.productService.getProducts().subscribe({
      next: (response) => {
        const products = Array.isArray(response) ? response : (response.results || []);
        this.products = products.filter((p: Product) => p.is_active);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des produits', error);
      }
    });
  }

  loadShops() {
    this.shopService.getShops().subscribe({
      next: (shops) => {
        this.shops = shops;
        const user = this.authService.getCurrentUser();
        if (user?.shop && shops.find(s => s.id === user.shop)) {
          this.inventory.shop = user.shop;
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des boutiques', error);
      }
    });
  }

  onSubmit() {
    if (this.isFormValid()) {
      this.isLoading = true;
      const inventoryData = {
        product: Number(this.inventory.product),
        shop: Number(this.inventory.shop),
        quantity: Number(this.inventory.quantity),
        min_quantity: Number(this.inventory.min_quantity) || 0,
        max_quantity: this.inventory.max_quantity ? Number(this.inventory.max_quantity) : undefined,
        location: this.inventory.location || undefined,
        initial_quantity: Number(this.inventory.quantity)
      };

      this.inventoryService.createInventory(inventoryData as any).subscribe({
        next: (created) => {
          this.toastService.success('Inventaire créé avec succès !');
          const createdId = created?.id;
          if (createdId !== undefined && createdId !== null && typeof createdId === 'number') {
            this.router.navigate(['/inventory/detail', createdId as number]);
          } else {
            this.router.navigate(['/inventory']);
          }
        },
        error: (error) => {
          this.toastService.error('Erreur lors de la création de l\'inventaire');
          console.error(error);
          this.isLoading = false;
        }
      });
    }
  }

  isFormValid(): boolean {
    return !!(
      this.inventory.product &&
      Number(this.inventory.product) > 0 &&
      this.inventory.shop &&
      Number(this.inventory.shop) > 0 &&
      this.inventory.quantity !== undefined &&
      Number(this.inventory.quantity) >= 0
    );
  }

  cancel() {
    this.router.navigate(['/inventory']);
  }
}

