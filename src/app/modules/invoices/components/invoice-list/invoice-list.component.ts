import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter, Subscription } from 'rxjs';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { InvoiceService, Invoice } from '../../../../core/services/invoice.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CurrencyFormatPipe, PaginationComponent],
  templateUrl: './invoice-list.component.html',
  styleUrl: './invoice-list.component.css'
})
export class InvoiceListComponent implements OnInit, OnDestroy {
  invoices: Invoice[] = [];
  filteredInvoices: Invoice[] = [];
  displayedInvoices: Invoice[] = [];
  searchTerm: string = '';
  statusFilter: 'all' | 'paid' | 'pending' = 'all';
  isLoading = false;
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;
  totalPages: number = 1;

  private routerSubscription?: Subscription;

  constructor(
    private router: Router,
    private invoiceService: InvoiceService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadInvoices();
    
    // Recharger les données quand on revient sur cette route
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.url === '/invoices' || event.url.startsWith('/invoices?')) {
          this.loadInvoices();
        }
      });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  loadInvoices() {
    this.isLoading = true;
    const user = this.authService.getCurrentUser();
    const params: any = {};
    
    if (user?.shop) {
      params.shop = user.shop;
    }

    this.invoiceService.getInvoices(params).subscribe({
      next: (invoices) => {
        this.invoices = invoices;
        this.filteredInvoices = [...invoices];
        this.totalItems = this.filteredInvoices.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        this.updateDisplayedInvoices();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des factures', error);
        this.isLoading = false;
      }
    });
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
    this.filteredInvoices = this.invoices.filter(invoice => {
      const matchesSearch = 
        invoice.invoice_number?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        invoice.customer_name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        invoice.shop_name?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const paymentStatus = invoice.payment_status || invoice.status || 'pending';
      const matchesStatus = this.statusFilter === 'all' || paymentStatus === this.statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    this.totalItems = this.filteredInvoices.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.updateDisplayedInvoices();
  }
  
  updateDisplayedInvoices() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedInvoices = this.filteredInvoices.slice(startIndex, endIndex);
  }
  
  onPageChange(page: number) {
    this.currentPage = page;
    this.updateDisplayedInvoices();
  }
  
  onPageSizeChange(pageSize: number) {
    this.pageSize = pageSize;
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.updateDisplayedInvoices();
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'paid': 'Payée',
      'pending': 'En attente',
      'overdue': 'En retard',
      'cancelled': 'Annulée'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    return `status-badge ${status}`;
  }

  printInvoice(id: number) {
    window.open(`/invoices/view/${id}?print=true`, '_blank');
  }
}
