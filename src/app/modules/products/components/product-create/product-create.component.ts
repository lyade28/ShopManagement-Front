import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService, Product, Category } from '../../../../core/services/product.service';
import { InventoryService } from '../../../../core/services/inventory.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ShopService, Shop } from '../../../../core/services/shop.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-product-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-create.component.html',
  styleUrl: './product-create.component.css'
})
export class ProductCreateComponent implements OnInit {
  product: Partial<Product> = {
    name: '',
    sku: '',
    category: 0,
    unit: 'piece',
    purchase_price: undefined,
    selling_price: undefined,
    description: '',
    is_active: true,
    attributes: {} as any
  };

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
  initialQuantity = 0;
  minQuantity = 0;
  shopId?: number;
  shops: Shop[] = [];
  showShopSelection = false;

  duplicateProduct: Product | null = null;
  showDuplicateAlert = false;
  isLoading = false;
  isLoadingAttributes = false;

  constructor(
    private router: Router,
    private productService: ProductService,
    private inventoryService: InventoryService,
    private authService: AuthService,
    private shopService: ShopService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.loadCategories();
    this.loadShops();
    const user = this.authService.getCurrentUser();
    if (user?.shop) {
      this.shopId = user.shop;
    } else if (this.authService.isAdmin()) {
      // Si admin, permettre la sélection de boutique
      this.showShopSelection = true;
    }
  }

  loadShops() {
    this.shopService.getShops().subscribe({
      next: (shops: Shop[]) => {
        this.shops = shops;
        // Si admin et pas de shop sélectionné, prendre le premier par défaut
        if (this.authService.isAdmin() && shops.length > 0 && !this.shopId) {
          this.shopId = shops[0].id;
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des boutiques', error);
      }
    });
  }

  loadCategories() {
    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        console.log('Catégories chargées:', categories);
        // Précharger les attributs pour chaque catégorie (optionnel, pour améliorer les performances)
        categories.forEach(cat => {
          if (cat.attributes && cat.attributes.length > 0) {
            // Trier par ordre
            const sortedAttributes = cat.attributes.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
            this.categoryAttributes[cat.id] = sortedAttributes;
            console.log(`Attributs préchargés pour catégorie ${cat.id} (${cat.name}):`, sortedAttributes);
          }
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement des catégories', error);
      }
    });
  }

  onCategoryChange() {
    if (this.product.category) {
      // Convertir la valeur en nombre (les selects retournent des strings)
      let categoryId: number;
      const categoryValue = this.product.category;

      if (typeof categoryValue === 'number') {
        categoryId = categoryValue;
      } else if (typeof categoryValue === 'string') {
        // Essayer de parser comme nombre d'abord
        const parsed = parseInt(categoryValue, 10);
        if (!isNaN(parsed) && parsed > 0) {
          categoryId = parsed;
        } else {
          // Si ce n'est pas un nombre, chercher par nom
          const found = this.categories.find(c => c.name === categoryValue);
          categoryId = found?.id || 0;
        }
      } else {
        categoryId = 0;
      }

      console.log('onCategoryChange - categoryId:', categoryId, 'type original:', typeof this.product.category, 'valeur:', this.product.category);
      console.log('Catégories disponibles:', this.categories.map(c => ({ id: c.id, name: c.name })));

      if (!categoryId || categoryId <= 0 || isNaN(categoryId)) {
        console.warn('ID de catégorie invalide:', categoryId);
        this.selectedCategoryAttributes = [];
        this.product.attributes = {};
        this.isLoadingAttributes = false;
        return;
      }

      this.product.category = categoryId;

      // Réinitialiser les attributs du produit
      this.product.attributes = {};

      // Charger les attributs de la catégorie
      if (this.categoryAttributes[categoryId] && this.categoryAttributes[categoryId].length > 0) {
        // Utiliser les attributs déjà chargés
        this.selectedCategoryAttributes = [...this.categoryAttributes[categoryId]];
        this.isLoadingAttributes = false;
        console.log('Attributs chargés depuis le cache:', this.selectedCategoryAttributes);
        this.cdr.detectChanges();
      } else {
        // Charger les attributs depuis l'API
        this.selectedCategoryAttributes = []; // Réinitialiser d'abord
        this.isLoadingAttributes = true;
        console.log('Chargement des attributs pour la catégorie ID:', categoryId);
        console.log('URL API attendue: /api/products/attributes/?category=' + categoryId);

        this.productService.getCategoryAttributes(categoryId).subscribe({
          next: (attributes) => {
            console.log('✅ Attributs reçus de l\'API:', attributes);
            console.log('Type:', typeof attributes, 'Est un tableau?', Array.isArray(attributes));
            console.log('Nombre d\'attributs:', attributes?.length || 0);

            if (!attributes || !Array.isArray(attributes) || attributes.length === 0) {
              console.warn('⚠️ Aucun attribut retourné pour la catégorie:', categoryId);
              this.selectedCategoryAttributes = [];
              this.categoryAttributes[categoryId] = [];
              this.isLoadingAttributes = false;
              this.cdr.detectChanges();
              return;
            }

            // Trier les attributs par ordre
            const sortedAttributes = [...attributes].sort((a, b) => (a.order || 0) - (b.order || 0));
            this.categoryAttributes[categoryId] = sortedAttributes;
            this.selectedCategoryAttributes = [...sortedAttributes];
            this.isLoadingAttributes = false;
            console.log('✅ Attributs triés et assignés:', this.selectedCategoryAttributes);
            console.log('✅ selectedCategoryAttributes.length:', this.selectedCategoryAttributes.length);
            // Forcer la détection de changement
            this.cdr.detectChanges();
          },
          error: (error) => {
            console.error('❌ Erreur lors du chargement des attributs:', error);
            console.error('Détails de l\'erreur:', error.error || error.message);
            this.categoryAttributes[categoryId] = [];
            this.selectedCategoryAttributes = [];
            this.isLoadingAttributes = false;
            this.cdr.detectChanges();
          }
        });
      }
    } else {
      this.selectedCategoryAttributes = [];
      this.product.attributes = {};
      this.isLoadingAttributes = false;
    }
  }

  onSubmit() {
    if (this.isFormValid()) {
      this.isLoading = true;
      this.checkForDuplicates();
    }
  }

  checkForDuplicates() {
    if (!this.product.category || !this.product.name) return;

    this.productService.findDuplicateProduct(this.product as Product).subscribe({
      next: (duplicate) => {
        if (duplicate) {
          this.duplicateProduct = duplicate;
          this.showDuplicateAlert = true;
          this.isLoading = false;
        } else {
          this.createProduct();
        }
      },
      error: () => {
        // Si erreur, continuer avec la création
        this.createProduct();
      }
    });
  }

  createProduct() {
    // S'assurer que category est un nombre valide
    const categoryId = typeof this.product.category === 'number'
      ? this.product.category
      : parseInt(String(this.product.category), 10);

    if (!categoryId || categoryId <= 0) {
      this.toastService.warning('Veuillez sélectionner une catégorie valide');
      this.isLoading = false;
      return;
    }

    // Préparer les données du produit
    const productData: Partial<Product> = {
      name: this.product.name?.trim(),
      sku: this.product.sku?.trim() || undefined,
      category: categoryId,
      unit: this.product.unit || 'piece',
      purchase_price: Number(this.product.purchase_price),
      selling_price: Number(this.product.selling_price),
      description: this.product.description?.trim() || undefined,
      is_active: this.product.is_active !== undefined ? this.product.is_active : true,
      attributes: this.product.attributes || {}
    };

    this.productService.createProduct(productData).subscribe({
      next: (createdProduct) => {
        // Si une quantité initiale est spécifiée, créer l'inventaire
        if (this.initialQuantity > 0 && this.shopId) {
          this.createInitialInventory(createdProduct.id);
        } else {
          this.toastService.success('Produit créé avec succès !');
          this.isLoading = false;
          this.router.navigate(['/products']);
        }
      },
      error: (error) => {
        this.toastService.error('Erreur lors de la création du produit');
        console.error(error);
        this.isLoading = false;
      }
    });
  }

  createInitialInventory(productId: number) {
    if (!this.shopId) {
      console.warn('Aucune boutique sélectionnée, inventaire non créé');
      this.toastService.success('Produit créé avec succès ! Note: Aucun stock initial créé car aucune boutique n\'est sélectionnée.');
      this.isLoading = false;
      this.router.navigate(['/products']);
      return;
    }

    const inventoryData = {
      product: productId,
      shop: this.shopId,
      quantity: this.initialQuantity,
      min_quantity: this.minQuantity || 0,
      initial_quantity: this.initialQuantity
    };

    console.log('Création de l\'inventaire avec les données:', inventoryData);

    this.inventoryService.createInventory(inventoryData as any).subscribe({
      next: (createdInventory) => {
        console.log('Inventaire créé avec succès:', createdInventory);
        this.toastService.success(`Produit créé avec stock initial de ${this.initialQuantity} unités !`);
        this.isLoading = false;
        this.router.navigate(['/products']);
      },
      error: (error) => {
        // Le produit est créé même si l'inventaire échoue
        console.error('Erreur lors de la création de l\'inventaire:', error);
        this.toastService.warning(`Produit créé mais erreur lors de l'ajout du stock initial: ${error.error?.detail || error.message || 'Erreur inconnue'}`);
        this.isLoading = false;
        this.router.navigate(['/products']);
      }
    });
  }

  updateExistingProduct() {
    if (this.duplicateProduct && this.initialQuantity > 0 && this.shopId) {
      this.isLoading = true;
      // Mettre à jour le stock via l'inventaire
      this.inventoryService.getInventoriesList({ product: this.duplicateProduct.id, shop: this.shopId }).subscribe({
        next: (inventories) => {
          if (inventories.length > 0) {
            const inventory = inventories[0];
            const adjustment = {
              inventory_id: inventory.id,
              quantity: inventory.quantity + this.initialQuantity,
              reason: 'reception',
              notes: 'Ajout de stock depuis création produit'
            };
            this.inventoryService.adjustStock(adjustment).subscribe({
              next: () => {
                this.toastService.success(`Stock mis à jour ! Nouvelle quantité: ${adjustment.quantity}`);
                this.isLoading = false;
                this.router.navigate(['/products']);
              },
              error: (error) => {
                this.toastService.error('Erreur lors de la mise à jour du stock');
                console.error(error);
                this.isLoading = false;
              }
            });
          } else {
            // Créer un nouvel inventaire
            if (this.duplicateProduct?.id) {
              this.createInitialInventory(this.duplicateProduct.id);
            }
          }
        },
        error: () => {
          if (this.duplicateProduct?.id) {
            this.createInitialInventory(this.duplicateProduct.id);
          }
        }
      });
    } else {
      this.toastService.warning('Veuillez spécifier une quantité initiale et une boutique');
      this.isLoading = false;
    }
  }

  proceedWithNewProduct() {
    this.showDuplicateAlert = false;
    this.duplicateProduct = null;
    this.createProduct();
  }

  cancelDuplicate() {
    this.showDuplicateAlert = false;
    this.duplicateProduct = null;
    this.isLoading = false;
  }

  isFormValid(): boolean {
    // Vérifier que la catégorie est valide (pas 0 ou undefined)
    let categoryId: number;
    if (typeof this.product.category === 'number') {
      categoryId = this.product.category;
    } else if (typeof this.product.category === 'string') {
      const parsed = parseInt(this.product.category, 10);
      categoryId = (!isNaN(parsed) && parsed > 0) ? parsed : 0;
    } else {
      categoryId = 0;
    }

    const categoryValid: boolean = categoryId > 0 && !isNaN(categoryId);

    const nameValid: boolean = !!(this.product.name && String(this.product.name).trim().length > 0);
    const purchasePriceValid: boolean = this.product.purchase_price !== undefined &&
      this.product.purchase_price !== null &&
      Number(this.product.purchase_price) > 0;
    const sellingPriceValid: boolean = this.product.selling_price !== undefined &&
      this.product.selling_price !== null &&
      Number(this.product.selling_price) > 0;
    // La quantité initiale n'est pas obligatoire (peut être 0)
    const quantityValid: boolean = this.initialQuantity >= 0;

    const isValid: boolean = nameValid && categoryValid && purchasePriceValid && sellingPriceValid && quantityValid;

    console.log('🔍 État de validation:', {
      nameValid,
      categoryValid: categoryValid + ' (categoryId: ' + categoryId + ')',
      purchasePriceValid: purchasePriceValid + ' (price: ' + this.product.purchase_price + ')',
      sellingPriceValid: sellingPriceValid + ' (price: ' + this.product.selling_price + ')',
      quantityValid,
      isValid
    });

    // Log pour déboguer
    if (!isValid) {
      console.log('🔍 Validation du formulaire:', {
        nameValid,
        categoryValid,
        categoryId,
        purchasePriceValid,
        purchase_price: this.product.purchase_price,
        sellingPriceValid,
        selling_price: this.product.selling_price,
        quantityValid,
        initialQuantity: this.initialQuantity
      });
    }

    return isValid;
  }

  cancel() {
    this.router.navigate(['/products']);
  }

  getAttributesForCategory(): any[] {
    if (!this.product.category) return [];

    // Utiliser directement selectedCategoryAttributes qui est mis à jour dans onCategoryChange
    return this.selectedCategoryAttributes || [];
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

  getAttributeKeys(attributes?: any): string[] {
    if (!attributes) return [];
    return Object.keys(attributes).filter(key => attributes[key]);
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
}
