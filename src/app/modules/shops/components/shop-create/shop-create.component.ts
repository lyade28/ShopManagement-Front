import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ShopService, Shop } from '../../../../core/services/shop.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-shop-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shop-create.component.html',
  styleUrl: './shop-create.component.css'
})
export class ShopCreateComponent {
  shop: Partial<Shop> = {
    name: '',
    address: '',
    phone: '',
    email: '',
    is_active: true
  };

  isLoading = false;

  constructor(
    private router: Router,
    private shopService: ShopService,
    private toastService: ToastService
  ) {}

  onSubmit() {
    if (this.isFormValid()) {
      this.isLoading = true;
      this.shopService.createShop(this.shop).subscribe({
        next: () => {
          this.toastService.success('Boutique créée avec succès !');
          this.router.navigate(['/shops']);
        },
        error: (error) => {
          this.toastService.error('Erreur lors de la création de la boutique');
          console.error(error);
          this.isLoading = false;
        }
      });
    }
  }

  isFormValid(): boolean {
    return !!this.shop.name;
  }

  cancel() {
    this.router.navigate(['/shops']);
  }
}
