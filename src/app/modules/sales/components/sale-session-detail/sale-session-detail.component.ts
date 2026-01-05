import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { SaleService, SaleSession, Sale } from '../../../../core/services/sale.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';

@Component({
  selector: 'app-sale-session-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyFormatPipe],
  templateUrl: './sale-session-detail.component.html',
  styleUrl: './sale-session-detail.component.css'
})
export class SaleSessionDetailComponent implements OnInit {
  sessionId!: number;
  session: SaleSession | null = null;
  sales: Sale[] = [];
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private saleService: SaleService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.sessionId = +this.route.snapshot.paramMap.get('id')!;
    this.loadSession();
    this.loadSales();
  }

  loadSession() {
    this.isLoading = true;
    this.saleService.getSession(this.sessionId).subscribe({
      next: (session) => {
        this.session = session;
        this.isLoading = false;
      },
      error: (error) => {
        this.toastService.error('Session non trouvée');
        console.error(error);
        this.isLoading = false;
        this.router.navigate(['/sales/sessions']);
      }
    });
  }

  loadSales() {
    this.saleService.getSales({ session: this.sessionId }).subscribe({
      next: (sales) => {
        this.sales = sales;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des ventes', error);
      }
    });
  }

  closeSession() {
    this.confirmationService.confirm({
      title: 'Fermer la session',
      message: 'Êtes-vous sûr de vouloir fermer cette session ?',
      confirmText: 'Fermer',
      cancelText: 'Annuler',
      type: 'warning'
    }).then(confirmed => {
      if (confirmed) {
        this.saleService.closeSession(this.sessionId).subscribe({
          next: () => {
            this.toastService.success('Session fermée avec succès !');
            this.loadSession();
          },
          error: (error) => {
            this.toastService.error('Erreur lors de la fermeture de la session');
            console.error(error);
          }
        });
      }
    });
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
}

