import { Injectable, signal, effect } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ApiService } from './api.service';
import { ToastService } from './toast.service';
import { AuthService } from './auth.service';

export interface Notification {
  id: number;
  type: 'low_stock' | 'new_sale' | 'system' | 'info';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  link?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();
  
  private pollingInterval = 30000; // 30 secondes
  private pollingSubscription?: any;

  constructor(
    private apiService: ApiService,
    private toastService: ToastService,
    private authService: AuthService
  ) {
    // Démarrer le polling si l'utilisateur est authentifié
    effect(() => {
      const isAuth = this.authService.isAuthenticated();
      if (isAuth) {
        this.startPolling();
      } else {
        this.stopPolling();
      }
    });
  }

  /**
   * Démarrer le polling des notifications
   */
  startPolling() {
    this.stopPolling(); // Arrêter le polling existant si présent
    
    // Charger immédiatement
    this.loadNotifications();
    
    // Puis poller toutes les 30 secondes
    this.pollingSubscription = interval(this.pollingInterval).subscribe(() => {
      this.loadNotifications();
    });
  }

  /**
   * Arrêter le polling
   */
  stopPolling() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  /**
   * Charger les notifications depuis le backend
   */
  loadNotifications() {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    this.apiService.get<Notification[]>('notifications/').subscribe({
      next: (notifications) => {
        this.notificationsSubject.next(notifications);
        this.updateUnreadCount();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des notifications:', error);
      }
    });
  }

  /**
   * Obtenir toutes les notifications
   */
  getNotifications(): Observable<Notification[]> {
    return this.notifications$;
  }

  /**
   * Obtenir le nombre de notifications non lues
   */
  getUnreadCount(): Observable<number> {
    return this.unreadCount$;
  }

  /**
   * Marquer une notification comme lue
   */
  markAsRead(notificationId: number) {
    const notifications = this.notificationsSubject.value;
    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification && !notification.read) {
      // Mettre à jour localement
      notification.read = true;
      this.notificationsSubject.next([...notifications]);
      this.updateUnreadCount();
      
      // Envoyer au backend
      this.apiService.post(`notifications/${notificationId}/mark_read/`, {}).subscribe({
        error: (error) => {
          console.error('Erreur lors de la mise à jour de la notification:', error);
        }
      });
    }
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  markAllAsRead() {
    // Mettre à jour localement
    const notifications = this.notificationsSubject.value.map(n => ({ ...n, read: true }));
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount();
    
    // Envoyer au backend
    this.apiService.post('notifications/mark_all_read/', {}).subscribe({
      error: (error) => {
        console.error('Erreur lors de la mise à jour des notifications:', error);
      }
    });
  }

  /**
   * Supprimer une notification
   */
  removeNotification(notificationId: number) {
    // Mettre à jour localement
    const notifications = this.notificationsSubject.value.filter(n => n.id !== notificationId);
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount();
    
    // Envoyer au backend
    this.apiService.delete(`notifications/${notificationId}/`).subscribe({
      error: (error) => {
        console.error('Erreur lors de la suppression de la notification:', error);
      }
    });
  }

  /**
   * Ajouter une notification manuellement
   */
  addNotification(notification: Notification) {
    const current = this.notificationsSubject.value;
    
    // Vérifier si la notification existe déjà
    if (!current.find(n => n.id === notification.id)) {
      const updated = [notification, ...current];
      this.notificationsSubject.next(updated);
      this.updateUnreadCount();
      
      // Afficher un toast pour les notifications importantes
      if (notification.type === 'low_stock' || notification.type === 'new_sale') {
        this.toastService.warning(notification.message, 5000);
      }
    }
  }

  /**
   * Mettre à jour le compteur de notifications non lues
   */
  private updateUnreadCount() {
    const count = this.notificationsSubject.value.filter(n => !n.read).length;
    this.unreadCountSubject.next(count);
  }

  /**
   * Créer une notification de stock faible
   */
  createLowStockNotification(productName: string, shopName: string, quantity: number) {
    const notification: Notification = {
      id: Date.now(),
      type: 'low_stock',
      title: 'Stock faible',
      message: `${productName} (${shopName}) : Stock faible (${quantity} unités)`,
      read: false,
      created_at: new Date().toISOString(),
      link: '/inventory'
    };
    this.addNotification(notification);
  }

  /**
   * Créer une notification de nouvelle vente
   */
  createNewSaleNotification(saleNumber: string, amount: number) {
    const notification: Notification = {
      id: Date.now(),
      type: 'new_sale',
      title: 'Nouvelle vente',
      message: `Vente ${saleNumber} : ${amount.toLocaleString('fr-FR')} FCFA`,
      read: false,
      created_at: new Date().toISOString(),
      link: '/sales'
    };
    this.addNotification(notification);
  }
}

