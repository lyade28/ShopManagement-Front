import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter, Subscription } from 'rxjs';
import { SaleService, SaleSession } from '../../../../core/services/sale.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-sale-session-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PaginationComponent],
  templateUrl: './sale-session-list.component.html',
  styleUrl: './sale-session-list.component.css'
})
export class SaleSessionListComponent implements OnInit, OnDestroy {
  sessions: SaleSession[] = [];
  filteredSessions: SaleSession[] = [];
  displayedSessions: SaleSession[] = [];
  searchTerm: string = '';
  statusFilter: 'all' | 'open' | 'closed' = 'all';
  isLoading = false;
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;
  totalPages: number = 1;

  private routerSubscription?: Subscription;
  
  // Statistiques
  get totalSessions(): number {
    return this.sessions.length;
  }
  
  get openSessions(): number {
    return this.sessions.filter(s => s.status === 'open').length;
  }
  
  get closedSessions(): number {
    return this.sessions.filter(s => s.status === 'closed').length;
  }
  
  get totalRevenue(): number {
    return this.sessions.reduce((sum, s) => sum + (s.total_sales || 0), 0);
  }

  constructor(
    private router: Router,
    private saleService: SaleService,
    private authService: AuthService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadSessions();
    
    // Recharger les données quand on revient sur cette route
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.url === '/sales/sessions' || event.url.startsWith('/sales/sessions?')) {
          this.loadSessions();
        }
      });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  loadSessions() {
    this.isLoading = true;
    const user = this.authService.getCurrentUser();
    const params: any = {};
    
    if (user?.role === 'seller') {
      // Les vendeurs voient seulement leurs sessions
      params.seller = user.id;
    }

    this.saleService.getSessions(params).subscribe({
      next: (sessions) => {
        this.sessions = sessions;
        this.filteredSessions = [...sessions];
        this.totalItems = this.filteredSessions.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        this.updateDisplayedSessions();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des sessions', error);
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
    this.filteredSessions = this.sessions.filter(session => {
      const matchesSearch = 
        session.shop_name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        session.seller_name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        session.session_number?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = this.statusFilter === 'all' || session.status === this.statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    this.totalItems = this.filteredSessions.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.updateDisplayedSessions();
  }
  
  updateDisplayedSessions() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedSessions = this.filteredSessions.slice(startIndex, endIndex);
  }
  
  onPageChange(page: number) {
    this.currentPage = page;
    this.updateDisplayedSessions();
  }
  
  onPageSizeChange(pageSize: number) {
    this.pageSize = pageSize;
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.updateDisplayedSessions();
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'open': 'Ouverte',
      'closed': 'Fermée',
      'cancelled': 'Annulée'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  }

  getSessionDuration(startTime: string, endTime?: string): string {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  closeSession(sessionId: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    this.confirmationService.confirm({
      title: 'Fermer la session',
      message: 'Êtes-vous sûr de vouloir fermer cette session ?\n\nUne fois fermée, vous ne pourrez plus effectuer de nouvelles ventes avec cette session.',
      confirmText: 'Fermer',
      cancelText: 'Annuler',
      type: 'warning'
    }).then(confirmed => {
      if (confirmed) {
        this.saleService.closeSession(sessionId).subscribe({
          next: (session) => {
            this.toastService.success('Session fermée avec succès !');
            this.loadSessions(); // Recharger la liste
          },
          error: (error) => {
            console.error('Erreur lors de la fermeture de la session:', error);
            const errorMessage = error.error?.error || error.error?.detail || 'Erreur lors de la fermeture de la session';
            this.toastService.error(errorMessage);
          }
        });
      }
    });
  }
}
