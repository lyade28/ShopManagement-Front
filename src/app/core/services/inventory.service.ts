import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { CacheService } from './cache.service';
import { PaginatedResponse, PaginationService } from './pagination.service';

export interface Inventory {
  id: number;
  product: number;
  product_name?: string;
  product_sku?: string;
  product_category?: string;
  purchase_price?: number;
  selling_price?: number;
  shop: number;
  shop_name?: string;
  quantity: number;
  min_quantity: number;
  max_quantity?: number;
  location?: string;
  last_restocked_at?: string;
  is_low_stock?: boolean;
  updated_at?: string;
}

export interface StockMovement {
  id: number;
  product: number;
  product_name?: string;
  shop: number;
  shop_name?: string;
  movement_type: 'entry' | 'exit' | 'adjustment';
  quantity: number;
  reason: string;
  reference?: string;
  user?: number;
  user_name?: string;
  notes?: string;
  created_at: string;
}

export interface StockAdjustment {
  inventory_id: number;
  quantity: number;
  reason: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  constructor(
    private apiService: ApiService,
    private cacheService: CacheService,
    private paginationService: PaginationService
  ) {}

  // Méthode paginée (nouvelle)
  getInventories(params?: any): Observable<PaginatedResponse<Inventory>> {
    const cacheKey = this.cacheService.generateKey('inventories', params);
    
    return this.cacheService.cacheObservable(
      cacheKey,
      this.apiService.get<any>('inventory/', params).pipe(
        map((response: any) => {
          if (this.paginationService.isPaginated(response)) {
            return response;
          }
          return {
            count: Array.isArray(response) ? response.length : 0,
            next: null,
            previous: null,
            results: Array.isArray(response) ? response : []
          };
        })
      ),
      3 * 60 * 1000 // Cache 3 minutes
    );
  }
  
  // Méthode de compatibilité qui retourne un tableau (pour les composants existants)
  getInventoriesList(params?: any): Observable<Inventory[]> {
    return this.getInventories(params).pipe(
      map(response => this.paginationService.extractResults(response))
    );
  }

  // Récupérer un seul inventaire par ID
  getInventory(id: number): Observable<Inventory> {
    return this.apiService.get<Inventory>(`inventory/${id}/`);
  }

  updateInventory(id: number, inventory: Partial<Inventory>): Observable<Inventory> {
    return this.apiService.put<Inventory>(`inventory/${id}/`, inventory);
  }

  getLowStock(shopId?: number): Observable<Inventory[]> {
    const params = shopId ? { shop: shopId } : {};
    return this.apiService.get<Inventory[]>('inventory/low_stock/', params).pipe(
      map(response => Array.isArray(response) ? response : [])
    );
  }

  // Méthode paginée (nouvelle)
  getMovements(params?: any): Observable<PaginatedResponse<StockMovement>> {
    // Le backend attend 'product' ou 'shop' comme paramètres
    // Si 'inventory' est passé, on le convertit en 'product'
    const apiParams: any = {};
    if (params) {
      if (params.inventory) {
        // Pour obtenir les mouvements d'un inventaire, on doit d'abord récupérer l'inventaire
        // ou utiliser le product_id de l'inventaire
        apiParams.product = params.inventory;
      } else {
        Object.assign(apiParams, params);
      }
    }
    
    const cacheKey = this.cacheService.generateKey('movements', apiParams);
    
    return this.cacheService.cacheObservable(
      cacheKey,
      this.apiService.get<any>('inventory/movements/', apiParams).pipe(
        map((response: any) => {
          if (this.paginationService.isPaginated(response)) {
            return response;
          }
          return {
            count: Array.isArray(response) ? response.length : 0,
            next: null,
            previous: null,
            results: Array.isArray(response) ? response : []
          };
        })
      ),
      5 * 60 * 1000 // Cache 5 minutes
    );
  }
  
  // Méthode de compatibilité qui retourne un tableau
  getMovementsList(params?: any): Observable<StockMovement[]> {
    return this.getMovements(params).pipe(
      map(response => this.paginationService.extractResults(response))
    );
  }

  adjustStock(adjustment: StockAdjustment): Observable<any> {
    return this.apiService.post('inventory/adjust/', adjustment);
  }

  createInventory(inventory: Partial<Inventory>): Observable<Inventory> {
    return this.apiService.post<Inventory>('inventory/', inventory);
  }
}

