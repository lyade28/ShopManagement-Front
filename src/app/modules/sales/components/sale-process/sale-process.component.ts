import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { ProductService, Product } from '../../../../core/services/product.service';
import { InventoryService, Inventory } from '../../../../core/services/inventory.service';
import { SaleService, Sale, SaleItem } from '../../../../core/services/sale.service';
import { AuthService } from '../../../../core/services/auth.service';
import { InvoiceService } from '../../../../core/services/invoice.service';
import { ToastService } from '../../../../core/services/toast.service';
import { OfflineService } from '../../../../core/services/offline.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { Subscription } from 'rxjs';

interface CartItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  inventory_id?: number;
}

interface ProductWithStock extends Product {
  stock?: number;
  inventory_id?: number;
}

@Component({
  selector: 'app-sale-process',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyFormatPipe],
  templateUrl: './sale-process.component.html',
  styleUrl: './sale-process.component.css'
})
export class SaleProcessComponent implements OnInit, OnDestroy {
  sessionId!: number;
  session: any = null;
  shopId?: number;
  buyerName: string = '';
  buyerContact: string = '';
  cart: CartItem[] = [];
  availableProducts: ProductWithStock[] = [];
  selectedProduct: ProductWithStock | null = null;
  quantity: number = 1;
  isLoading = false;
  isLoadingProducts = false;
  paymentMethod: string = 'cash';
  isOnline: boolean = true;
  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private inventoryService: InventoryService,
    private saleService: SaleService,
    private authService: AuthService,
    private invoiceService: InvoiceService,
    private toastService: ToastService,
    private offlineService: OfflineService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.sessionId = +this.route.snapshot.paramMap.get('id')!;
    this.isOnline = this.offlineService.isOnline();
    
    // Écouter les changements de statut réseau
    const onlineSub = this.offlineService.isOnline$.subscribe(isOnline => {
      this.isOnline = isOnline;
      if (isOnline) {
        // Synchroniser les ventes hors ligne quand on revient en ligne
        this.offlineService.syncOfflineSales().then(result => {
          if (result.success > 0) {
            this.toastService.success(`${result.success} vente(s) synchronisée(s) avec succès !`);
          }
          if (result.failed > 0) {
            this.toastService.warning(`${result.failed} vente(s) n'ont pas pu être synchronisée(s).`);
          }
        });
      }
    });
    this.subscriptions.add(onlineSub);
    
    this.loadSession();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  loadSession() {
    this.saleService.getSession(this.sessionId).subscribe({
      next: (session) => {
        console.log('Session chargée:', session);
        this.session = session;
        this.shopId = session.shop;
        this.loadProducts();
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la session:', error);
        this.toastService.error('Erreur lors du chargement de la session de vente');
        this.router.navigate(['/sales/sessions']);
      }
    });
  }

  loadProducts() {
    if (!this.shopId) {
      console.error('shopId non disponible');
      this.toastService.error('Boutique non trouvée dans la session');
      this.router.navigate(['/sales/sessions']);
      return;
    }

    this.isLoadingProducts = true;
    console.log('Chargement des produits pour la boutique:', this.shopId);

    // Charger les produits actifs
    this.productService.getProducts({ is_active: true }).subscribe({
      next: (response) => {
        const products = response.results || [];
        
        // Charger l'inventaire pour cette boutique
        this.inventoryService.getInventoriesList({ shop: this.shopId }).subscribe({
          next: (inventories) => {
            // Combiner produits et inventaire
            this.availableProducts = products.map(product => {
              const inventory = inventories.find((inv: any) => inv.product === product.id);
              return {
                ...product,
                stock: inventory?.quantity || 0,
                inventory_id: inventory?.id
              };
            }).filter(p => p.stock && p.stock > 0); // Seulement les produits en stock
            
            this.isLoadingProducts = false;
          },
          error: (error) => {
            console.error('Erreur lors du chargement de l\'inventaire', error);
            this.isLoadingProducts = false;
          }
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement des produits', error);
        this.isLoadingProducts = false;
      }
    });
  }

  onProductSelect(product: ProductWithStock) {
    this.selectedProduct = product;
    this.quantity = 1;
  }

  addToCart() {
    if (!this.selectedProduct || this.quantity <= 0) return;
    if (this.quantity > (this.selectedProduct.stock || 0)) {
      this.toastService.warning('Stock insuffisant !');
      return;
    }

    const existingItem = this.cart.find(item => item.product_id === this.selectedProduct!.id);
    if (existingItem) {
      const newQuantity = existingItem.quantity + this.quantity;
      if (newQuantity > (this.selectedProduct.stock || 0)) {
        this.toastService.warning('Stock insuffisant pour cette quantité !');
        return;
      }
      existingItem.quantity = newQuantity;
      existingItem.total = existingItem.quantity * existingItem.unit_price;
    } else {
      this.cart.push({
        product_id: this.selectedProduct.id,
        product_name: this.selectedProduct.name,
        quantity: this.quantity,
        unit_price: this.selectedProduct.selling_price,
        total: this.quantity * this.selectedProduct.selling_price,
        inventory_id: this.selectedProduct.inventory_id
      });
    }

    this.selectedProduct = null;
    this.quantity = 1;
  }

  removeFromCart(index: number) {
    this.cart.splice(index, 1);
  }

  updateCartItem(item: CartItem) {
    const product = this.availableProducts.find(p => p.id === item.product_id);
    if (product && item.quantity > (product.stock || 0)) {
      this.toastService.warning('Stock insuffisant !');
      item.quantity = product.stock || 0;
    }
    item.total = item.quantity * item.unit_price;
  }

  getSubtotal(): number {
    return this.cart.reduce((sum, item) => sum + item.total, 0);
  }

  // Remises
  discountType: 'percentage' | 'fixed' = 'percentage';
  discountValue: number = 0;
  discountAmount: number = 0;

  getDiscount(): number {
    if (this.discountValue <= 0) return 0;
    
    if (this.discountType === 'percentage') {
      this.discountAmount = (this.getSubtotal() * this.discountValue) / 100;
    } else {
      this.discountAmount = Math.min(this.discountValue, this.getSubtotal());
    }
    
    return this.discountAmount;
  }

  getSubtotalAfterDiscount(): number {
    return Math.max(0, this.getSubtotal() - this.getDiscount());
  }

  getTax(): number {
    return this.getSubtotalAfterDiscount() * 0.18; // TVA 18%
  }

  getTotal(): number {
    return this.getSubtotalAfterDiscount() + this.getTax();
  }

  onDiscountChange() {
    // Recalculer automatiquement
    this.getDiscount();
  }

  processSale() {
    console.log('processSale() appelé');
    
    if (!this.buyerName || !this.buyerName.trim()) {
      this.toastService.warning('Veuillez saisir le nom du client');
      return;
    }

    if (this.cart.length === 0) {
      this.toastService.warning('Le panier est vide');
      return;
    }

    console.log('Début du traitement de la vente...');
    this.isLoading = true;

    const saleItems: SaleItem[] = this.cart.map(item => ({
      product: item.product_id,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      discount: 0,
      subtotal: Number(item.total)
    }));

    const saleData: any = {
      session: this.sessionId,
      customer_name: this.buyerName.trim(),
      customer_contact: this.buyerContact?.trim() || undefined,
      subtotal: Number(this.getSubtotal().toFixed(2)),
      discount: Number(this.getDiscount().toFixed(2)),
      tax: Number(this.getTax().toFixed(2)),
      total: Number(this.getTotal().toFixed(2)),
      payment_method: this.paymentMethod,
      payment_status: 'paid',
      status: 'completed',
      items: saleItems
    };
    
    console.log('Données de vente à envoyer:', saleData);

    // Vérifier si on est en ligne
    if (!this.isOnline) {
      // Mode hors ligne : sauvegarder localement
      const offlineSaleId = this.offlineService.saveOfflineSale(saleData);
      this.toastService.warning(
        `Vente enregistrée en mode hors ligne (ID: ${offlineSaleId.substring(0, 20)}...). Elle sera synchronisée automatiquement quand la connexion sera rétablie.`,
        10000
      );
      
      // Réinitialiser le formulaire
      this.resetSaleForm();
      this.isLoading = false;
      return;
    }

    // Mode en ligne : envoyer au serveur
    this.saleService.createSale(saleData).subscribe({
      next: (sale) => {
        console.log('Vente créée:', sale);
        
        // Vérifier que sale.id existe
        if (!sale || !sale.id) {
          console.error('Erreur: sale.id est undefined', sale);
          this.toastService.error('Vente enregistrée mais impossible de récupérer la facture. ID de vente manquant.');
          // Réinitialiser quand même
          this.buyerName = '';
          this.buyerContact = '';
          this.cart = [];
          this.paymentMethod = 'cash';
          this.loadProducts();
          this.isLoading = false;
          return;
        }
        
        // Attendre un peu pour que la facture soit créée par le backend
        setTimeout(() => {
          // Récupérer la facture associée à la vente
          this.invoiceService.getInvoiceBySale(sale.id).subscribe({
            next: (invoice) => {
              console.log('Facture récupérée:', invoice);
              
              // Générer et imprimer le ticket directement
              this.printInvoiceTicket(invoice);
              
              // Afficher un message de confirmation
              const totalFormatted = typeof invoice.total === 'number' 
                ? invoice.total.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : invoice.total;
              const confirmMessage = `Vente enregistrée avec succès !\n\nFacture #${invoice.invoice_number}\nTotal: ${totalFormatted} FCFA\n\nLe ticket s'ouvre pour l'impression.\n\nVoulez-vous continuer avec une nouvelle vente ?`;
              
              this.confirmationService.confirm({
                title: 'Vente réussie',
                message: confirmMessage,
                confirmText: 'Nouvelle vente',
                cancelText: 'Terminer',
                type: 'info'
              }).then(confirmed => {
                if (confirmed) {
                  // Réinitialiser pour une nouvelle vente
                  this.buyerName = '';
                  this.buyerContact = '';
                  this.cart = [];
                  this.paymentMethod = 'cash';
                  
                  // Recharger les produits pour mettre à jour les stocks
                  this.loadProducts();
                } else {
                  // Rediriger vers la liste des sessions
                  this.router.navigate(['/sales/sessions']);
                }
              });
              
              this.isLoading = false;
            },
          error: (invoiceError) => {
            console.error('Erreur lors de la récupération de la facture:', invoiceError);
            
            // Même si la facture n'est pas récupérée, la vente est enregistrée
            this.toastService.success('Vente enregistrée avec succès ! La facture sera disponible dans la liste des factures.');
            
            // Réinitialiser
            this.buyerName = '';
            this.buyerContact = '';
            this.cart = [];
            this.paymentMethod = 'cash';
            
            // Recharger les produits pour mettre à jour les stocks
            this.loadProducts();
            
            this.isLoading = false;
          }
          });
        }, 500); // Attendre 500ms pour que le backend crée la facture
      },
      error: (error) => {
        console.error('Erreur lors de l\'enregistrement de la vente:', error);
        
        // Si l'erreur est due à une perte de connexion, sauvegarder en mode hors ligne
        if (!this.offlineService.isOnline() || error.status === 0) {
          const offlineSaleId = this.offlineService.saveOfflineSale(saleData);
          this.toastService.warning(
            `Connexion perdue. Vente enregistrée en mode hors ligne (ID: ${offlineSaleId.substring(0, 20)}...). Elle sera synchronisée automatiquement quand la connexion sera rétablie.`,
            10000
          );
          this.resetSaleForm();
        } else {
          this.toastService.error('Erreur lors de l\'enregistrement de la vente');
        }
        
        this.isLoading = false;
      }
    });
  }

  resetSaleForm() {
    this.buyerName = '';
    this.buyerContact = '';
    this.cart = [];
    this.paymentMethod = 'cash';
    this.loadProducts();
  }

  cancel() {
    this.router.navigate(['/sales']);
  }

  decreaseQuantity() {
    this.quantity = Math.max(1, this.quantity - 1);
  }

  increaseQuantity() {
    if (this.selectedProduct) {
      this.quantity = Math.min(this.selectedProduct.stock || 0, this.quantity + 1);
    }
  }

  printInvoiceTicket(invoice: any) {
    console.log('printInvoiceTicket appelé avec:', invoice);
    
    try {
      // Créer une fenêtre popup pour l'impression
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        console.warn('Popup bloquée, tentative de téléchargement PDF');
        // Si la popup est bloquée, essayer de télécharger le PDF
        this.downloadInvoicePdf(invoice.id);
        return;
      }

    // Formater la date
    const issueDate = new Date(invoice.issue_date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Formater les montants
    const formatCurrency = (amount: number) => {
      return typeof amount === 'number' 
        ? amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : amount;
    };

    // Générer le HTML de la facture
    const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Facture ${invoice.invoice_number}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      color: #333;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 30px;
    }
    .invoice-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #333;
    }
    .company-info h2 {
      font-size: 24px;
      margin-bottom: 10px;
    }
    .company-info p {
      font-size: 12px;
      margin: 3px 0;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-info h1 {
      font-size: 28px;
      margin-bottom: 10px;
      color: #333;
    }
    .invoice-info p {
      font-size: 12px;
      margin: 3px 0;
    }
    .client-info {
      margin-bottom: 30px;
    }
    .client-info h3 {
      font-size: 14px;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    .client-info p {
      font-size: 12px;
      margin: 3px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background: #f5f5f5;
      padding: 12px;
      text-align: left;
      font-size: 12px;
      font-weight: bold;
      border-bottom: 2px solid #ddd;
    }
    td {
      padding: 10px 12px;
      font-size: 12px;
      border-bottom: 1px solid #eee;
    }
    .text-right {
      text-align: right;
    }
    .totals {
      margin-top: 20px;
      margin-left: auto;
      width: 300px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }
    .total-row.final {
      font-size: 18px;
      font-weight: bold;
      border-top: 2px solid #333;
      padding-top: 10px;
      margin-top: 10px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 11px;
      color: #666;
    }
    @media print {
      body {
        padding: 0;
      }
      .invoice-container {
        padding: 20px;
      }
      @page {
        margin: 1cm;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="invoice-header">
      <div class="company-info">
        <h2>${invoice.seller_info?.shop_name || 'Votre Entreprise'}</h2>
        <p>${invoice.seller_info?.shop_address || ''}</p>
        <p>${invoice.seller_info?.shop_phone || ''}</p>
      </div>
      <div class="invoice-info">
        <h1>FACTURE</h1>
        <p><strong>N°:</strong> ${invoice.invoice_number}</p>
        <p><strong>Date:</strong> ${issueDate}</p>
      </div>
    </div>

    <div class="client-info">
      <h3>Client</h3>
      <p><strong>Nom:</strong> ${invoice.customer_name}</p>
      ${invoice.customer_info?.contact ? `<p><strong>Contact:</strong> ${invoice.customer_info.contact}</p>` : ''}
    </div>

    <table>
      <thead>
        <tr>
          <th>Produit</th>
          <th class="text-right">Qté</th>
          <th class="text-right">Prix unitaire</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items?.map((item: any) => `
          <tr>
            <td>${item.product_name || 'Produit'}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${formatCurrency(item.unit_price)} FCFA</td>
            <td class="text-right">${formatCurrency(item.subtotal)} FCFA</td>
          </tr>
        `).join('') || ''}
      </tbody>
    </table>

    <div class="totals">
      <div class="total-row">
        <span>Sous-total:</span>
        <span>${formatCurrency(invoice.subtotal)} FCFA</span>
      </div>
      <div class="total-row">
        <span>TVA (18%):</span>
        <span>${formatCurrency(invoice.tax)} FCFA</span>
      </div>
      <div class="total-row final">
        <span>TOTAL:</span>
        <span>${formatCurrency(invoice.total)} FCFA</span>
      </div>
    </div>

    <div class="footer">
      <p>Merci de votre achat !</p>
      <p>${invoice.seller_info?.shop_name || ''}</p>
    </div>
  </div>

  <script>
    window.onload = function() {
      window.print();
      // Fermer la fenêtre après impression (optionnel)
      // setTimeout(() => window.close(), 1000);
    };
  </script>
</body>
</html>
    `;

      printWindow.document.write(invoiceHtml);
      printWindow.document.close();
      console.log('Fenêtre d\'impression ouverte');
    } catch (error) {
      console.error('Erreur lors de l\'ouverture de la fenêtre d\'impression:', error);
      // Fallback: télécharger le PDF
      this.downloadInvoicePdf(invoice.id);
    }
  }

  downloadInvoicePdf(invoiceId: number) {
    this.invoiceService.downloadInvoicePdf(invoiceId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `facture-${invoiceId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Erreur lors du téléchargement du PDF:', error);
        // Si le PDF n'est pas disponible, ouvrir la page de visualisation
        window.open(`/invoices/view/${invoiceId}`, '_blank');
      }
    });
  }
}
