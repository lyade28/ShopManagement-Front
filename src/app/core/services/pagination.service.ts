import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PaginationService {
  private defaultPageSize = 20;

  /**
   * Extrait les paramètres de pagination d'une réponse paginée
   */
  extractPaginationParams(response: any): PaginationParams {
    if (response.next) {
      const url = new URL(response.next);
      return {
        page: parseInt(url.searchParams.get('page') || '1'),
        page_size: parseInt(url.searchParams.get('page_size') || String(this.defaultPageSize))
      };
    }
    return { page: 1, page_size: this.defaultPageSize };
  }

  /**
   * Crée les paramètres de requête pour la pagination
   */
  createParams(page: number = 1, pageSize: number = this.defaultPageSize): any {
    return {
      page,
      page_size: pageSize
    };
  }

  /**
   * Vérifie si une réponse est paginée
   */
  isPaginated(response: any): response is PaginatedResponse<any> {
    return response && typeof response === 'object' && 'count' in response && 'results' in response;
  }

  /**
   * Extrait les résultats d'une réponse paginée ou non
   */
  extractResults<T>(response: any): T[] {
    if (this.isPaginated(response)) {
      return response.results;
    }
    // Si ce n'est pas paginé, retourner directement le tableau
    return Array.isArray(response) ? response : [];
  }

  /**
   * Calcule le nombre total de pages
   */
  getTotalPages(count: number, pageSize: number): number {
    return Math.ceil(count / pageSize);
  }
}

