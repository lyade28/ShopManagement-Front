import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { SaleService, Sale } from '../../../../core/services/sale.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ShopService, Shop } from '../../../../core/services/shop.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-sale-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CurrencyFormatPipe, PaginationComponent],
  templateUrl: './sale-list.component.html',
  styleUrl: './sale-list.component.css'
})
export class SaleListComponent implements OnInit {
  sales: Sale[] = [];
  filteredSales: Sale[] = [];
  displayedSales: Sale[] = [];
  shops: Shop[] = [];
  searchTerm: string = '';
  selectedShop: number | 'all' = 'all';
  statusFilter: 'all' | 'completed' | 'cancelled' = 'all';
  isLoading = false;
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;
  totalPages: number = 1;

  constructor(
    private saleService: SaleService,
    private shopService: ShopService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadShops();
    this.loadSales();
  }

  loadShops() {
    this.shopService.getShops().subscribe({
      next: (shops) => {
        this.shops = shops;
        const user = this.authService.getCurrentUser();
        if (user?.shop && shops.find(s => s.id === user.shop)) {
          this.selectedShop = user.shop;
        }
      }
    });
  }

  loadSales() {
    this.isLoading = true;
    const params: any = {};
    
    if (this.selectedShop !== 'all') {
      params.shop = this.selectedShop;
    }

    const user = this.authService.getCurrentUser();
    if (user?.role === 'seller') {
      params.seller = user.id;
    }

    this.saleService.getSales(params).subscribe({
      next: (sales) => {
        this.sales = sales;
        this.filteredSales = [...sales];
        this.totalItems = this.filteredSales.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        this.updateDisplayedSales();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des ventes', error);
        this.isLoading = false;
      }
    });
  }

  onShopChange() {
    this.currentPage = 1;
    this.loadSales();
  }

  onSearchChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onStatusFilterChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters() {
    this.filteredSales = this.sales.filter(sale => {
      const matchesSearch = 
        sale.sale_number?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        sale.customer_name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        sale.shop_name?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = this.statusFilter === 'all' || sale.status === this.statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    this.totalItems = this.filteredSales.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.updateDisplayedSales();
  }
  
  updateDisplayedSales() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedSales = this.filteredSales.slice(startIndex, endIndex);
  }
  
  onPageChange(page: number) {
    this.currentPage = page;
    this.updateDisplayedSales();
  }
  
  onPageSizeChange(pageSize: number) {
    this.pageSize = pageSize;
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.updateDisplayedSales();
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'completed': 'Complétée',
      'cancelled': 'Annulée',
      'pending': 'En attente'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }
}

