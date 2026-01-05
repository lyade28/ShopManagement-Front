import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { InvoiceService, Invoice } from '../../../../core/services/invoice.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-invoice-view',
  standalone: true,
  imports: [CommonModule, CurrencyFormatPipe],
  templateUrl: './invoice-view.component.html',
  styleUrl: './invoice-view.component.css'
})
export class InvoiceViewComponent implements OnInit {
  invoiceId!: number;
  invoice: Invoice | null = null;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private invoiceService: InvoiceService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.invoiceId = +this.route.snapshot.paramMap.get('id')!;
    this.loadInvoice();
  }

  loadInvoice() {
    this.isLoading = true;
    this.invoiceService.getInvoice(this.invoiceId).subscribe({
      next: (invoice) => {
        this.invoice = invoice;
        this.isLoading = false;
      },
      error: (error) => {
        this.toastService.error('Facture non trouvée');
        console.error(error);
        this.isLoading = false;
        this.router.navigate(['/invoices']);
      }
    });
  }

  printInvoice() {
    window.print();
  }

  downloadPdf() {
    this.invoiceService.downloadInvoicePdf(this.invoiceId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `facture-${this.invoice?.invoice_number || this.invoiceId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        this.toastService.error('Erreur lors du téléchargement du PDF');
        console.error(error);
      }
    });
  }
}

