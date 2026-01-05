import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ShopService } from '../../../../core/services/shop.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  form = {
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    password_confirm: '',
    role: 'seller' as 'admin' | 'seller',
    shop_id: null as number | null
  };

  shops: any[] = [];
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  showPasswordConfirm = false;

  constructor(
    private authService: AuthService,
    private shopService: ShopService,
    private router: Router
  ) {
    this.loadShops();
  }

  loadShops() {
    this.shopService.getShops().subscribe({
      next: (shops) => {
        this.shops = shops;
      },
      error: () => {
        // Si erreur, continuer sans shops
      }
    });
  }

  onSubmit() {
    if (!this.isFormValid()) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    if (this.form.password !== this.form.password_confirm) {
      this.errorMessage = 'Les mots de passe ne correspondent pas';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const userData = {
      username: this.form.username,
      email: this.form.email,
      password: this.form.password,
      password_confirm: this.form.password_confirm,
      first_name: this.form.first_name,
      last_name: this.form.last_name,
      role: this.form.role,
      shop: this.form.shop_id || null,
      phone: this.form.phone || null
    };

    this.authService.register(userData).subscribe({
      next: (user: any) => {
        // Après création, connecter l'utilisateur
        this.authService.login(this.form.username, this.form.password).subscribe({
          next: () => {
            this.router.navigate(['/dashboard']);
            this.isLoading = false;
          },
          error: () => {
            this.errorMessage = 'Compte créé mais erreur de connexion. Veuillez vous connecter.';
            this.isLoading = false;
            this.router.navigate(['/auth/login']);
          }
        });
      },
      error: (error) => {
        this.errorMessage = error.error?.error || error.error?.detail || 'Erreur lors de la création du compte';
        this.isLoading = false;
      }
    });
  }

  isFormValid(): boolean {
    return !!(
      this.form.username &&
      this.form.email &&
      this.form.first_name &&
      this.form.last_name &&
      this.form.password &&
      this.form.password_confirm &&
      (this.form.role === 'admin' || this.form.shop_id)
    );
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  togglePasswordConfirmVisibility() {
    this.showPasswordConfirm = !this.showPasswordConfirm;
  }
}
