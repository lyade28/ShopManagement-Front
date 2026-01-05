import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SaleService, Sale } from './sale.service';
import { InventoryService } from './inventory.service';
import { ProductService } from './product.service';

export interface OfflineSale {
  id: string; // ID temporaire unique
  session_id: number;
  customer_name: string;
  customer_contact?: string;
  items: Array<{
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: string;
  payment_status: string;
  status: string;
  created_at: string;
  synced: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  private readonly OFFLINE_SALES_KEY = 'offline_sales';
  private readonly OFFLINE_PRODUCTS_KEY = 'offline_products';
  private readonly OFFLINE_INVENTORY_KEY = 'offline_inventory';
  
  private isOnlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  public isOnline$ = this.isOnlineSubject.asObservable();

  constructor(
    private saleService: SaleService,
    private inventoryService: InventoryService,
    private productService: ProductService
  ) {
    // Écouter les changements de statut réseau
    window.addEventListener('online', () => {
      this.isOnlineSubject.next(true);
      this.syncOfflineSales();
    });
    
    window.addEventListener('offline', () => {
      this.isOnlineSubject.next(false);
    });
  }

  /**
   * Vérifier si l'application est en ligne
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Sauvegarder une vente hors ligne
   */
  saveOfflineSale(saleData: any): string {
    const offlineSale: OfflineSale = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      session_id: saleData.session,
      customer_name: saleData.customer_name,
      customer_contact: saleData.customer_contact,
      items: saleData.items.map((item: any) => ({
        product_id: item.product,
        product_name: item.product_name || 'Produit',
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.subtotal || (item.quantity * item.unit_price)
      })),
      subtotal: saleData.subtotal,
      discount: saleData.discount || 0,
      tax: saleData.tax || 0,
      total: saleData.total,
      payment_method: saleData.payment_method || 'cash',
      payment_status: saleData.payment_status || 'paid',
      status: saleData.status || 'completed',
      created_at: new Date().toISOString(),
      synced: false
    };

    const offlineSales = this.getOfflineSales();
    offlineSales.push(offlineSale);
    this.setOfflineSales(offlineSales);

    return offlineSale.id;
  }

  /**
   * Obtenir toutes les ventes hors ligne
   */
  getOfflineSales(): OfflineSale[] {
    try {
      const data = localStorage.getItem(this.OFFLINE_SALES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Obtenir les ventes non synchronisées
   */
  getUnsyncedSales(): OfflineSale[] {
    return this.getOfflineSales().filter(sale => !sale.synced);
  }

  /**
   * Sauvegarder les ventes hors ligne
   */
  private setOfflineSales(sales: OfflineSale[]): void {
    localStorage.setItem(this.OFFLINE_SALES_KEY, JSON.stringify(sales));
  }

  /**
   * Marquer une vente comme synchronisée
   */
  markSaleAsSynced(saleId: string): void {
    const sales = this.getOfflineSales();
    const sale = sales.find(s => s.id === saleId);
    if (sale) {
      sale.synced = true;
      this.setOfflineSales(sales);
    }
  }

  /**
   * Supprimer une vente synchronisée
   */
  removeSyncedSale(saleId: string): void {
    const sales = this.getOfflineSales();
    const filtered = sales.filter(s => s.id !== saleId || !s.synced);
    this.setOfflineSales(filtered);
  }

  /**
   * Synchroniser les ventes hors ligne avec le serveur
   */
  async syncOfflineSales(): Promise<{ success: number; failed: number }> {
    if (!this.isOnline()) {
      return { success: 0, failed: 0 };
    }

    const unsyncedSales = this.getUnsyncedSales();
    let success = 0;
    let failed = 0;

    for (const sale of unsyncedSales) {
      try {
        // Convertir la vente hors ligne en format API
        const saleData = {
          session: sale.session_id,
          customer_name: sale.customer_name,
          customer_contact: sale.customer_contact,
          items: sale.items.map(item => ({
            product: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount: 0,
            subtotal: item.total
          })),
          subtotal: sale.subtotal,
          discount: sale.discount,
          tax: sale.tax,
          total: sale.total,
          payment_method: sale.payment_method,
          payment_status: sale.payment_status,
          status: sale.status
        };

        // Envoyer au serveur
        await this.saleService.createSale(saleData).toPromise();
        
        // Marquer comme synchronisée
        this.markSaleAsSynced(sale.id);
        success++;
      } catch (error) {
        console.error(`Erreur lors de la synchronisation de la vente ${sale.id}:`, error);
        failed++;
      }
    }

    // Nettoyer les ventes synchronisées anciennes (plus de 7 jours)
    this.cleanOldSyncedSales();

    return { success, failed };
  }

  /**
   * Nettoyer les ventes synchronisées anciennes
   */
  private cleanOldSyncedSales(): void {
    const sales = this.getOfflineSales();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const filtered = sales.filter(sale => {
      if (!sale.synced) return true;
      const saleDate = new Date(sale.created_at);
      return saleDate > sevenDaysAgo;
    });

    this.setOfflineSales(filtered);
  }

  /**
   * Sauvegarder les produits en cache pour mode hors ligne
   */
  cacheProducts(products: any[]): void {
    try {
      localStorage.setItem(this.OFFLINE_PRODUCTS_KEY, JSON.stringify(products));
    } catch (error) {
      console.error('Erreur lors de la mise en cache des produits:', error);
    }
  }

  /**
   * Obtenir les produits en cache
   */
  getCachedProducts(): any[] {
    try {
      const data = localStorage.getItem(this.OFFLINE_PRODUCTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Sauvegarder l'inventaire en cache pour mode hors ligne
   */
  cacheInventory(inventory: any[]): void {
    try {
      localStorage.setItem(this.OFFLINE_INVENTORY_KEY, JSON.stringify(inventory));
    } catch (error) {
      console.error('Erreur lors de la mise en cache de l\'inventaire:', error);
    }
  }

  /**
   * Obtenir l'inventaire en cache
   */
  getCachedInventory(): any[] {
    try {
      const data = localStorage.getItem(this.OFFLINE_INVENTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Vérifier si des données sont en cache
   */
  hasCachedData(): boolean {
    return this.getCachedProducts().length > 0 || this.getCachedInventory().length > 0;
  }

  /**
   * Nettoyer tous les caches
   */
  clearCache(): void {
    localStorage.removeItem(this.OFFLINE_SALES_KEY);
    localStorage.removeItem(this.OFFLINE_PRODUCTS_KEY);
    localStorage.removeItem(this.OFFLINE_INVENTORY_KEY);
  }
}

