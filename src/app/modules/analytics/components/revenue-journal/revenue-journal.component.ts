import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsService, RevenueJournal } from '../../../../core/services/analytics.service';
import { AuthService } from '../../../../core/services/auth.service';

interface RevenueEntry {
  id: number;
  date: string;
  description: string;
  type: 'sale' | 'expense' | 'adjustment';
  amount: number;
  shop_name: string;
  invoice_number?: string;
}

@Component({
  selector: 'app-revenue-journal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './revenue-journal.component.html',
  styleUrl: './revenue-journal.component.css'
})
export class RevenueJournalComponent implements OnInit {
  entries: RevenueEntry[] = [];
  filteredEntries: RevenueEntry[] = [];
  searchTerm: string = '';
  typeFilter: 'all' | 'sale' | 'expense' | 'adjustment' = 'all';
  isLoading = false;

  constructor(
    private analyticsService: AnalyticsService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadRevenueJournal();
  }

  loadRevenueJournal() {
    this.isLoading = true;
    const user = this.authService.getCurrentUser();
    const params: any = {};
    
    if (user?.shop) {
      params.shop = user.shop;
    }

    this.analyticsService.getRevenue(params).subscribe({
      next: (data: any) => {
        if (data.journals && Array.isArray(data.journals)) {
          this.entries = data.journals.map((journal: RevenueJournal) => ({
            id: journal.id,
            date: journal.date,
            description: journal.description,
            type: this.getTransactionType(journal.transaction_type),
            amount: journal.amount,
            shop_name: journal.shop_name || 'Boutique',
            invoice_number: journal.reference_type === 'invoice' ? String(journal.reference_id) : undefined
          }));
        } else {
          this.entries = [];
        }
        this.filteredEntries = [...this.entries];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du journal des revenus', error);
        this.entries = [];
        this.filteredEntries = [];
        this.isLoading = false;
      }
    });
  }

  getTransactionType(type: string): 'sale' | 'expense' | 'adjustment' {
    if (type.includes('sale') || type.includes('vente')) return 'sale';
    if (type.includes('expense') || type.includes('dépense')) return 'expense';
    return 'adjustment';
  }

  onSearchChange() {
    this.applyFilters();
  }

  onTypeFilterChange() {
    this.applyFilters();
  }

  applyFilters() {
    this.filteredEntries = this.entries.filter(entry => {
      const matchesSearch = 
        entry.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        entry.shop_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        entry.invoice_number?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesType = this.typeFilter === 'all' || entry.type === this.typeFilter;
      
      return matchesSearch && matchesType;
    });
  }

  getTotalRevenue(): number {
    return this.filteredEntries
      .filter(e => e.type === 'sale')
      .reduce((sum, e) => sum + e.amount, 0);
  }

  getTotalExpenses(): number {
    return this.filteredEntries
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);
  }

  getNetRevenue(): number {
    return this.filteredEntries.reduce((sum, e) => {
      if (e.type === 'sale') return sum + e.amount;
      if (e.type === 'expense' || e.type === 'adjustment') return sum - Math.abs(e.amount);
      return sum;
    }, 0);
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'sale': 'Vente',
      'expense': 'Dépense',
      'adjustment': 'Ajustement'
    };
    return labels[type] || type;
  }

  getTypeClass(type: string): string {
    return `type-badge ${type}`;
  }
}
