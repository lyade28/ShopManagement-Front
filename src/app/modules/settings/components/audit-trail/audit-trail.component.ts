import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditService, AuditLog, AuditStats } from '../../../../core/services/audit.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-audit-trail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-trail.component.html',
  styleUrl: './audit-trail.component.css'
})
export class AuditTrailComponent implements OnInit {
  logs: AuditLog[] = [];
  stats: AuditStats | null = null;
  isLoading = false;
  
  // Filtres
  selectedAction: string = 'all';
  selectedModel: string = 'all';
  selectedUser: string = 'all';
  startDate: string = '';
  endDate: string = '';
  searchTerm: string = '';
  
  // Actions disponibles
  actions = [
    { value: 'all', label: 'Toutes' },
    { value: 'create', label: 'Création' },
    { value: 'update', label: 'Modification' },
    { value: 'delete', label: 'Suppression' },
    { value: 'view', label: 'Consultation' },
    { value: 'login', label: 'Connexion' },
    { value: 'logout', label: 'Déconnexion' }
  ];
  
  // Modèles disponibles
  models = [
    { value: 'all', label: 'Tous' },
    { value: 'Product', label: 'Produit' },
    { value: 'Inventory', label: 'Inventaire' },
    { value: 'Sale', label: 'Vente' },
    { value: 'Shop', label: 'Boutique' },
    { value: 'Category', label: 'Catégorie' },
    { value: 'User', label: 'Utilisateur' }
  ];

  constructor(
    private auditService: AuditService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadLogs();
    this.loadStats();
  }

  loadLogs() {
    this.isLoading = true;
    const params: any = {};
    
    if (this.selectedAction !== 'all') {
      params.action = this.selectedAction;
    }
    if (this.selectedModel !== 'all') {
      params.model_name = this.selectedModel;
    }
    if (this.selectedUser !== 'all') {
      params.user = this.selectedUser;
    }
    if (this.startDate) {
      params.start_date = this.startDate;
    }
    if (this.endDate) {
      params.end_date = this.endDate;
    }
    if (this.searchTerm) {
      params.search = this.searchTerm;
    }

    this.auditService.getAuditLogs(params).subscribe({
      next: (response) => {
        if (response.results) {
          this.logs = response.results;
        } else if (Array.isArray(response)) {
          this.logs = response;
        } else {
          this.logs = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.toastService.error('Erreur lors du chargement des logs d\'audit');
        console.error(error);
        this.isLoading = false;
      }
    });
  }

  loadStats() {
    this.auditService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques', error);
      }
    });
  }

  applyFilters() {
    this.loadLogs();
  }

  resetFilters() {
    this.selectedAction = 'all';
    this.selectedModel = 'all';
    this.selectedUser = 'all';
    this.startDate = '';
    this.endDate = '';
    this.searchTerm = '';
    this.loadLogs();
  }

  getActionIcon(action: string): string {
    const icons: { [key: string]: string } = {
      'create': 'bi-plus-circle-fill',
      'update': 'bi-pencil-fill',
      'delete': 'bi-trash-fill',
      'view': 'bi-eye-fill',
      'login': 'bi-box-arrow-in-right',
      'logout': 'bi-box-arrow-right'
    };
    return icons[action] || 'bi-circle-fill';
  }

  getActionColor(action: string): string {
    const colors: { [key: string]: string } = {
      'create': 'success',
      'update': 'warning',
      'delete': 'error',
      'view': 'info',
      'login': 'success',
      'logout': 'info'
    };
    return colors[action] || 'muted';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('fr-FR');
  }

  hasChanges(changes: any): boolean {
    return changes && typeof changes === 'object' && Object.keys(changes).length > 0;
  }
}

