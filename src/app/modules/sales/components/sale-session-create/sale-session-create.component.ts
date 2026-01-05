import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SaleService } from '../../../../core/services/sale.service';
import { ShopService, Shop } from '../../../../core/services/shop.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { User } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-sale-session-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sale-session-create.component.html',
  styleUrl: './sale-session-create.component.css'
})
export class SaleSessionCreateComponent implements OnInit {
  session = {
    shop_id: null as number | null,
    seller_id: null as number | null
  };
  shops: Shop[] = [];
  sellers: User[] = [];
  filteredSellers: User[] = [];
  isLoading = false;
  isAdmin = false;
  currentUser: User | null = null;

  constructor(
    private router: Router,
    private saleService: SaleService,
    private shopService: ShopService,
    private userService: UserService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.isAdmin = this.currentUser?.role === 'admin';
    
    if (this.isAdmin) {
      // Les admins peuvent créer des sessions pour n'importe quel vendeur
      this.loadShops();
      this.loadSellers();
    } else {
      // Les vendeurs créent leur propre session
      if (this.currentUser?.shop) {
        this.session.shop_id = this.currentUser.shop;
        // Le seller_id sera ignoré par le backend, mais on le met quand même
        this.session.seller_id = this.currentUser.id;
      } else {
        this.toastService.warning('Vous n\'êtes associé à aucune boutique. Contactez un administrateur.');
        this.router.navigate(['/sales/sessions']);
      }
    }
  }

  loadShops() {
    this.shopService.getShops().subscribe({
      next: (shops) => {
        this.shops = shops;
      }
    });
  }

  loadSellers() {
    this.userService.getUsers({ role: 'seller' }).subscribe({
      next: (users) => {
        console.log('✅ Vendeurs chargés:', users);
        console.log('Nombre de vendeurs:', users.length);
        this.sellers = users;
        // Si une boutique est déjà sélectionnée, filtrer immédiatement
        if (this.session.shop_id) {
          this.onShopChange();
        }
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des vendeurs:', error);
        this.toastService.error('Erreur lors du chargement des vendeurs');
      }
    });
  }

  onShopChange() {
    console.log('=== 🔄 Changement de boutique ===');
    console.log('shop_id sélectionné:', this.session.shop_id);
    console.log('Type de shop_id:', typeof this.session.shop_id);
    console.log('Tous les vendeurs chargés:', this.sellers);
    console.log('Nombre total de vendeurs:', this.sellers.length);
    
    if (this.session.shop_id) {
      // Convertir shop_id en nombre pour la comparaison
      const shopIdNum = Number(this.session.shop_id);
      console.log('shop_id converti en nombre:', shopIdNum);
      
      // Filtrer les vendeurs par boutique
      // Vérifier à la fois shop et shop_id (au cas où les deux existent)
      this.filteredSellers = this.sellers.filter(s => {
        const sellerShop = s.shop || s.shop_id;
        const sellerShopNum = Number(sellerShop);
        const matches = sellerShopNum === shopIdNum;
        
        console.log(`📋 Vendeur ${s.first_name} ${s.last_name}:`, {
          shop: s.shop,
          shop_id: s.shop_id,
          sellerShop: sellerShop,
          sellerShopNum: sellerShopNum,
          shopIdNum: shopIdNum,
          matches: matches
        });
        
        return matches;
      });
      
      console.log('✅ Vendeurs filtrés pour boutique', shopIdNum, ':', this.filteredSellers);
      console.log('📊 Nombre de vendeurs trouvés:', this.filteredSellers.length);
      
      if (this.filteredSellers.length === 0) {
        this.session.seller_id = null;
        console.warn('⚠️ Aucun vendeur trouvé pour cette boutique');
        console.warn('💡 Vérifiez que des vendeurs sont bien associés à cette boutique dans le module Gestion des utilisateurs');
      }
    } else {
      this.filteredSellers = [];
      this.session.seller_id = null;
      console.log('ℹ️ Aucune boutique sélectionnée, liste des vendeurs vidée');
    }
  }

  onSubmit() {
    if (!this.isFormValid()) {
      this.toastService.warning('Veuillez remplir tous les champs');
      return;
    }

    if (!this.session.shop_id) {
      this.toastService.warning('Veuillez sélectionner une boutique');
      return;
    }

    this.isLoading = true;
    // Pour les vendeurs, seller_id est ignoré par le backend (utilise l'utilisateur connecté)
    // Pour les admins, on envoie le seller_id sélectionné
    const sellerId = this.isAdmin ? (this.session.seller_id || undefined) : undefined;
    this.saleService.createSession(this.session.shop_id!, sellerId).subscribe({
      next: (session) => {
        console.log('Session créée avec succès:', session);
        // Rediriger vers la page de vente avec la session créée
        if (session && session.id) {
          this.toastService.success('Session créée avec succès !');
          this.router.navigate(['/sales/sell', session.id]);
        } else {
          this.toastService.success('Session créée avec succès !');
          this.router.navigate(['/sales/sessions']);
        }
      },
      error: (error) => {
        console.error('Erreur lors de la création de la session:', error);
        const errorMessage = error.error?.detail || error.error?.error || 'Erreur lors de la création de la session';
        this.toastService.error(errorMessage);
        this.isLoading = false;
      }
    });
  }

  isFormValid(): boolean {
    if (this.isAdmin) {
      // Pour les admins, les deux champs sont requis
      return !!(this.session.shop_id && this.session.seller_id);
    } else {
      // Pour les vendeurs, seule la boutique est nécessaire (seller_id est automatique)
      return !!this.session.shop_id;
    }
  }

  cancel() {
    this.router.navigate(['/sales/sessions']);
  }
}
