import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ShopService, Shop } from '../../../../core/services/shop.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-shop-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shop-edit.component.html',
  styleUrl: './shop-edit.component.css'
})
export class ShopEditComponent implements OnInit {
  shop: Partial<Shop> = {};
  shopId!: number;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private shopService: ShopService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.shopId = +this.route.snapshot.paramMap.get('id')!;
    this.loadShop();
  }

  loadShop() {
    this.isLoading = true;
    this.shopService.getShop(this.shopId).subscribe({
      next: (shop) => {
        this.shop = { ...shop };
        this.isLoading = false;
      },
      error: (error) => {
        this.toastService.error('Erreur lors du chargement de la boutique');
        console.error(error);
        this.router.navigate(['/shops']);
      }
    });
  }

  onSubmit() {
    if (this.isFormValid()) {
      this.isLoading = true;
      this.shopService.updateShop(this.shopId, this.shop).subscribe({
        next: () => {
          this.toastService.success('Boutique mise à jour avec succès !');
          this.router.navigate(['/shops']);
        },
        error: (error) => {
          this.toastService.error('Erreur lors de la mise à jour');
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
