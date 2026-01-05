import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { CacheService } from './cache.service';
import { PaginatedResponse, PaginationService } from './pagination.service';

export interface Product {
  id: number;
  sku?: string;
  name: string;
  description?: string;
  category: number | any; // Peut être un nombre ou un objet Category dans le detail
  category_name?: string;
  unit: string;
  purchase_price: number;
  selling_price: number;
  image?: string;
  attributes?: any;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  attributes?: Attribute[];
  attributes_count?: number;
  products_count?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Attribute {
  id: number;
  category: number;
  category_name?: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  required: boolean;
  placeholder?: string;
  options?: string[];
  order: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(
    private apiService: ApiService,
    private cacheService: CacheService,
    private paginationService: PaginationService
  ) {}

  // Products
  getProducts(params?: any): Observable<{ results: Product[], count: number }> {
    return this.apiService.get<any>('products/', params).pipe(
      map((response: any) => {
        // Si pagination, retourner results et count
        if (response.results) {
          return response;
        }
        // Sinon, retourner comme liste
        return { results: Array.isArray(response) ? response : [response], count: Array.isArray(response) ? response.length : 1 };
      })
    );
  }

  getProduct(id: number): Observable<Product> {
    return this.apiService.get<Product>(`products/${id}/`);
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    return this.apiService.post<Product>('products/', product);
  }

  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    return this.apiService.put<Product>(`products/${id}/`, product);
  }

  deleteProduct(id: number): Observable<void> {
    return this.apiService.delete<void>(`products/${id}/`);
  }

  searchProducts(query: string): Observable<Product[]> {
    return this.apiService.get<Product[]>('products/', { search: query }).pipe(
      map((response: any) => Array.isArray(response) ? response : (response.results || []))
    );
  }

  findDuplicateProduct(product: Partial<Product>): Observable<Product | null> {
    return this.getProducts({ category: product.category, name: product.name }).pipe(
      map(response => {
        const products = response.results || [];
        return products.find(p => 
          p.name === product.name && 
          p.category === product.category &&
          JSON.stringify(p.attributes || {}) === JSON.stringify(product.attributes || {})
        ) || null;
      })
    );
  }

  // Categories
  getCategories(): Observable<Category[]> {
    return this.apiService.get<Category[]>('products/categories/').pipe(
      map((response: any) => Array.isArray(response) ? response : (response.results || []))
    );
  }

  getCategory(id: number): Observable<Category> {
    return this.apiService.get<Category>(`products/categories/${id}/`);
  }

  createCategory(category: Partial<Category>): Observable<Category> {
    return this.apiService.post<Category>('products/categories/', category);
  }

  updateCategory(id: number, category: Partial<Category>): Observable<Category> {
    return this.apiService.put<Category>(`products/categories/${id}/`, category);
  }

  deleteCategory(id: number): Observable<void> {
    return this.apiService.delete<void>(`products/categories/${id}/`);
  }

  // Attributes
  getAttributes(categoryId?: number): Observable<Attribute[]> {
    const params: any = {};
    if (categoryId !== undefined && categoryId !== null) {
      // Passer categoryId comme nombre (django-filter accepte les nombres)
      params.category = categoryId;
    }
    console.log('🔍 getAttributes appelé avec categoryId:', categoryId, 'type:', typeof categoryId);
    console.log('🔍 params:', params);
    console.log('🔍 URL attendue: /api/products/attributes/?category=' + categoryId);
    
    return this.apiService.get<Attribute[]>('products/attributes/', params).pipe(
      map((response: any) => {
        console.log('📦 Réponse brute de getAttributes:', response);
        console.log('📦 Type de réponse:', typeof response);
        console.log('📦 Est un tableau?', Array.isArray(response));
        if (response && typeof response === 'object') {
          console.log('📦 Clés de la réponse:', Object.keys(response));
        }
        
        let attributes: Attribute[] = [];
        if (Array.isArray(response)) {
          attributes = response;
          console.log('✅ Réponse est un tableau direct, nombre:', attributes.length);
        } else if (response && response.results && Array.isArray(response.results)) {
          attributes = response.results;
          console.log('✅ Réponse contient results, nombre:', attributes.length);
        } else if (response && Array.isArray(response.data)) {
          attributes = response.data;
          console.log('✅ Réponse contient data, nombre:', attributes.length);
        } else {
          console.warn('⚠️ Format de réponse inattendu:', response);
          console.warn('⚠️ Type:', typeof response);
        }
        
        console.log('✅ Attributs finaux extraits:', attributes);
        console.log('✅ Nombre total d\'attributs:', attributes.length);
        if (attributes.length > 0) {
          console.log('✅ Premier attribut:', JSON.stringify(attributes[0], null, 2));
        }
        return attributes;
      })
    );
  }

  getAttribute(id: number): Observable<Attribute> {
    return this.apiService.get<Attribute>(`products/attributes/${id}/`);
  }

  createAttribute(attribute: Partial<Attribute>): Observable<Attribute> {
    return this.apiService.post<Attribute>('products/attributes/', attribute);
  }

  updateAttribute(id: number, attribute: Partial<Attribute>): Observable<Attribute> {
    return this.apiService.put<Attribute>(`products/attributes/${id}/`, attribute);
  }

  deleteAttribute(id: number): Observable<void> {
    return this.apiService.delete<void>(`products/attributes/${id}/`);
  }

  // Get attributes for a specific category
  getCategoryAttributes(categoryId: number): Observable<Attribute[]> {
    return this.getAttributes(categoryId);
  }

  // Category attribute management (using the attributes endpoint with category filter)
  createCategoryAttribute(categoryId: number, attribute: Partial<Attribute>): Observable<Attribute> {
    const attributeData = { ...attribute, category: categoryId };
    return this.createAttribute(attributeData);
  }

  updateCategoryAttribute(categoryId: number, attributeId: number, attribute: Partial<Attribute>): Observable<Attribute> {
    return this.updateAttribute(attributeId, attribute);
  }

  deleteCategoryAttribute(categoryId: number, attributeId: number): Observable<void> {
    return this.deleteAttribute(attributeId);
  }
}
