import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ShopService, Shop } from '../../../../core/services/shop.service';
import { UserService } from '../../../../core/services/user.service';
import { User } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-shop-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './shop-detail.component.html',
  styleUrl: './shop-detail.component.css'
})
export class ShopDetailComponent implements OnInit {
  shop: Shop | null = null;
  sellers: User[] = [];
  shopId!: number;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private shopService: ShopService,
    private userService: UserService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.shopId = +this.route.snapshot.paramMap.get('id')!;
    this.loadShop();
    this.loadSellers();
  }

  loadShop() {
    this.isLoading = true;
    this.shopService.getShop(this.shopId).subscribe({
      next: (shop) => {
        this.shop = shop;
        if (shop.sellers) {
          this.sellers = shop.sellers;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.toastService.error('Boutique non trouvée');
        console.error(error);
        this.router.navigate(['/shops']);
      }
    });
  }

  loadSellers() {
    this.shopService.getShopSellers(this.shopId).subscribe({
      next: (sellers) => {
        this.sellers = sellers;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des vendeurs', error);
      }
    });
  }
}
