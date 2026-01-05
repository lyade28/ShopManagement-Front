import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../../core/services/user.service';
import { User } from '../../../../core/services/auth.service';
import { ShopService, Shop } from '../../../../core/services/shop.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-edit.component.html',
  styleUrl: './user-edit.component.css'
})
export class UserEditComponent implements OnInit {
  user: Partial<User> & { password?: string; password_confirm?: string } = {};
  userId!: number;
  shops: Shop[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private shopService: ShopService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.userId = +this.route.snapshot.paramMap.get('id')!;
    this.loadShops();
    this.loadUser();
  }

  loadShops() {
    this.shopService.getShops().subscribe({
      next: (shops) => {
        this.shops = shops;
      }
    });
  }

  loadUser() {
    this.isLoading = true;
    this.userService.getUser(this.userId).subscribe({
      next: (user) => {
        this.user = { ...user };
        this.isLoading = false;
      },
      error: (error) => {
        this.toastService.error('Utilisateur non trouvé');
        console.error(error);
        this.router.navigate(['/users']);
      }
    });
  }

  onSubmit() {
    if (this.isFormValid()) {
      this.isLoading = true;
      this.errorMessage = '';

      this.userService.updateUser(this.userId, this.user).subscribe({
        next: () => {
          this.toastService.success('Utilisateur mis à jour avec succès !');
          this.router.navigate(['/users']);
        },
        error: (error) => {
          this.errorMessage = error.error?.error || error.error?.detail || 'Erreur lors de la mise à jour';
          this.isLoading = false;
        }
      });
    }
  }

  isFormValid(): boolean {
    return !!(
      this.user.username &&
      this.user.email &&
      this.user.first_name &&
      this.user.last_name
    );
  }

  onRoleChange() {
    if (this.user.role === 'admin') {
      this.user.shop = undefined;
    }
  }

  cancel() {
    this.router.navigate(['/users']);
  }
}
