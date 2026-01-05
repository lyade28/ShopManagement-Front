import { Component, OnInit, EventEmitter, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() toggleSidebar = new EventEmitter<void>();

  notifications: Notification[] = [];
  unreadCount = 0;
  showUserMenu = false;
  showNotifications = false;
  private subscriptions = new Subscription();

  constructor(
    public themeService: ThemeService,
    public authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    // Vérifier l'état d'authentification
    this.authService.checkAuthStatus();
    
    // Charger les notifications
    this.loadNotifications();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  loadNotifications() {
    // S'abonner aux notifications
    const sub = this.notificationService.getNotifications().subscribe(notifications => {
      this.notifications = notifications;
    });
    this.subscriptions.add(sub);

    // S'abonner au compteur de non lues
    const countSub = this.notificationService.getUnreadCount().subscribe(count => {
      this.unreadCount = count;
    });
    this.subscriptions.add(countSub);
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  markAsRead(notification: Notification) {
    this.notificationService.markAsRead(notification.id);
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead();
  }

  removeNotification(notification: Notification, event: Event) {
    event.stopPropagation();
    this.notificationService.removeNotification(notification.id);
  }

  navigateToNotification(notification: Notification) {
    if (notification.link) {
      this.router.navigate([notification.link]);
      this.markAsRead(notification);
      this.showNotifications = false;
    }
  }

  formatTime(date: string): string {
    const now = new Date();
    const notificationDate = new Date(date);
    const diff = now.getTime() - notificationDate.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Il y a ${days}j`;
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  get isDarkMode(): boolean {
    return this.themeService.currentTheme() === 'dark';
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  logout() {
    this.confirmationService.confirm({
      title: 'Déconnexion',
      message: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      confirmText: 'Déconnecter',
      cancelText: 'Annuler',
      type: 'info'
    }).then(confirmed => {
      if (confirmed) {
        this.authService.logout().subscribe({
          next: () => {
            console.log('Déconnexion réussie');
            this.showUserMenu = false;
            // La redirection est gérée par clearAuth() dans AuthService
          },
          error: (error) => {
            console.error('Erreur lors de la déconnexion:', error);
            // Même en cas d'erreur, nettoyer localement et rediriger
            this.showUserMenu = false;
            // La méthode clearAuth() sera appelée même en cas d'erreur
            // mais on peut forcer la redirection ici aussi
            this.router.navigate(['/auth/login']);
          }
        });
      }
    });
  }

  get userInitials(): string {
    const user = this.authService.currentUser();
    if (user) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    }
    return 'U';
  }

  get userName(): string {
    const user = this.authService.currentUser();
    if (user) {
      return `${user.first_name} ${user.last_name}`;
    }
    return 'Utilisateur';
  }

  get userRole(): string {
    const user = this.authService.currentUser();
    if (user) {
      return user.role === 'admin' ? 'Administrateur' : 'Vendeur';
    }
    return '';
  }
}
