import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';
import { User } from '../../../../core/services/auth.service';
import { ShopService, Shop } from '../../../../core/services/shop.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PaginationComponent],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  displayedUsers: User[] = [];
  shops: Shop[] = [];
  searchTerm: string = '';
  selectedRole: string = 'all';
  roleFilter: 'all' | 'admin' | 'seller' = 'all';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  selectedShop: number | 'all' = 'all';
  isLoading = false;
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;
  totalPages: number = 1;

  constructor(
    private userService: UserService,
    private shopService: ShopService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadShops();
    this.loadUsers();
  }

  loadShops() {
    this.shopService.getShops().subscribe({
      next: (shops) => {
        this.shops = shops;
      }
    });
  }

  loadUsers() {
    this.isLoading = true;
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.filteredUsers = [...users];
        this.totalItems = this.filteredUsers.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        this.updateDisplayedUsers();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs', error);
        this.isLoading = false;
      }
    });
  }

  onSearchChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onRoleChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onRoleFilterChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onStatusFilterChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onShopChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters() {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = 
        user.username.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesRole = this.roleFilter === 'all' || user.role === this.roleFilter;
      const matchesStatus = this.statusFilter === 'all' || 
        (this.statusFilter === 'active' && user.is_active) ||
        (this.statusFilter === 'inactive' && !user.is_active);
      const matchesShop = this.selectedShop === 'all' || user.shop === this.selectedShop;
      return matchesSearch && matchesRole && matchesStatus && matchesShop;
    });
    
    // Mettre à jour la pagination
    this.totalItems = this.filteredUsers.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.updateDisplayedUsers();
  }
  
  updateDisplayedUsers() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedUsers = this.filteredUsers.slice(startIndex, endIndex);
  }
  
  onPageChange(page: number) {
    this.currentPage = page;
    this.updateDisplayedUsers();
  }
  
  onPageSizeChange(pageSize: number) {
    this.pageSize = pageSize;
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.updateDisplayedUsers();
  }

  getRoleLabel(role: string): string {
    return role === 'admin' ? 'Administrateur' : 'Vendeur';
  }

  getRoleClass(role: string): string {
    return role === 'admin' ? 'role-admin' : 'role-seller';
  }

  getStatusLabel(isActive: boolean | undefined): string {
    return isActive ? 'Actif' : 'Inactif';
  }

  getStatusClass(isActive: boolean | undefined): string {
    return isActive ? 'status-active' : 'status-inactive';
  }

  contactUser(user: User) {
    if (user.email) {
      this.toastService.info(`Email: ${user.email}`, 7000);
    } else if (user.phone) {
      this.toastService.info(`Téléphone: ${user.phone}`, 7000);
    } else {
      this.toastService.warning('Aucune information de contact disponible.');
    }
  }

  toggleUserStatus(user: User) {
    const newStatus = !user.is_active;
    this.userService.updateUser(user.id, { is_active: newStatus }).subscribe({
      next: () => {
        user.is_active = newStatus;
      },
      error: (error) => {
        this.toastService.error('Erreur lors de la mise à jour du statut');
        console.error(error);
      }
    });
  }

  deleteUser(id: number) {
    this.confirmationService.confirm({
      title: 'Supprimer l\'utilisateur',
      message: 'Êtes-vous sûr de vouloir supprimer cet utilisateur ?',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger'
    }).then(confirmed => {
      if (confirmed) {
        this.userService.deleteUser(id).subscribe({
          next: () => {
            this.toastService.success('Utilisateur supprimé avec succès');
            this.loadUsers();
          },
          error: (error) => {
            this.toastService.error('Erreur lors de la suppression');
            console.error(error);
          }
        });
      }
    });
  }
}
