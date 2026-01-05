import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../../../core/services/user.service';
import { ShopService, Shop } from '../../../../core/services/shop.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-create.component.html',
  styleUrl: './user-create.component.css'
})
export class UserCreateComponent implements OnInit {
  form = {
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'seller' as 'admin' | 'seller',
    shop: null as number | null,
    is_active: true
  };

  shops: Shop[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private userService: UserService,
    private shopService: ShopService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadShops();
  }

  loadShops() {
    this.shopService.getShops().subscribe({
      next: (shops) => {
        this.shops = shops;
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

    const userData: any = {
      username: this.form.username.trim(),
      email: this.form.email.trim(),
      password: this.form.password,
      password_confirm: this.form.password_confirm,
      first_name: this.form.first_name.trim(),
      last_name: this.form.last_name.trim(),
      role: this.form.role,
      is_active: this.form.is_active !== undefined ? this.form.is_active : true
    };

    // Ajouter phone seulement s'il est renseigné
    if (this.form.phone && this.form.phone.trim()) {
      userData.phone = this.form.phone.trim();
    }

    // Gérer shop : null pour admin, valeur pour seller (ou null si non sélectionné)
    if (this.form.role === 'admin') {
      // Ne pas inclure shop pour les admins
      delete userData.shop;
    } else if (this.form.role === 'seller') {
      // Pour les vendeurs, inclure shop même si null
      userData.shop = this.form.shop || null;
    }

    console.log('Données utilisateur à envoyer:', { ...userData, password: '***', password_confirm: '***' });

    this.userService.createUser(userData).subscribe({
      next: () => {
        this.toastService.success('Utilisateur créé avec succès !');
        this.router.navigate(['/users']);
      },
      error: (error) => {
        console.error('Erreur complète:', error);
        console.error('Erreur détaillée:', error.error);
        
        // Extraire le message d'erreur
        let errorMsg = 'Erreur lors de la création de l\'utilisateur';
        if (error.error) {
          if (typeof error.error === 'string') {
            errorMsg = error.error;
          } else if (error.error.detail) {
            errorMsg = error.error.detail;
          } else if (error.error.error) {
            errorMsg = error.error.error;
          } else if (error.error.non_field_errors) {
            errorMsg = Array.isArray(error.error.non_field_errors) 
              ? error.error.non_field_errors.join(', ') 
              : error.error.non_field_errors;
          } else {
            // Afficher toutes les erreurs de validation
            const errors = Object.entries(error.error)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join('\n');
            errorMsg = errors || errorMsg;
          }
        }
        
        this.errorMessage = errorMsg;
        this.isLoading = false;
        this.toastService.error(errorMsg);
      }
    });
  }

  isFormValid(): boolean {
    return !!(
      this.form.username &&
      this.form.email &&
      this.form.password &&
      this.form.password_confirm &&
      this.form.first_name &&
      this.form.last_name &&
      (this.form.role === 'admin' || this.form.shop)
    );
  }

  onRoleChange() {
    if (this.form.role === 'admin') {
      this.form.shop = null;
    }
  }

  cancel() {
    this.router.navigate(['/users']);
  }
}
