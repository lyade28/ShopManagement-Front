import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { SaleService, Sale } from '../../../../core/services/sale.service';
import { InvoiceService } from '../../../../core/services/invoice.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-sale-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyFormatPipe],
  templateUrl: './sale-detail.component.html',
  styleUrl: './sale-detail.component.css'
})
export class SaleDetailComponent implements OnInit {
  saleId!: number;
  sale: Sale | null = null;
  invoiceId: number | null = null;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private saleService: SaleService,
    private invoiceService: InvoiceService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.saleId = +this.route.snapshot.paramMap.get('id')!;
    this.loadSale();
  }

  loadSale() {
    this.isLoading = true;
    this.saleService.getSale(this.saleId).subscribe({
      next: (sale) => {
        this.sale = sale;
        this.isLoading = false;
        // Charger la facture associée si elle existe
        this.loadInvoice();
      },
      error: (error) => {
        this.toastService.error('Vente non trouvée');
        console.error(error);
        this.isLoading = false;
        this.router.navigate(['/sales']);
      }
    });
  }

  loadInvoice() {
    if (this.sale) {
      this.invoiceService.getInvoiceBySale(this.sale.id).subscribe({
        next: (invoice) => {
          this.invoiceId = invoice.id;
        },
        error: () => {
          // Pas de facture associée, c'est normal
          this.invoiceId = null;
        }
      });
    }
  }

  viewInvoice() {
    if (this.invoiceId) {
      this.router.navigate(['/invoices/view', this.invoiceId]);
    }
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

