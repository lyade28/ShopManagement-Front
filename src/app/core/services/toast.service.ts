import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    callback: () => void;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  private defaultDuration = 5000; // 5 secondes

  show(message: string, type: Toast['type'] = 'info', duration?: number, action?: Toast['action']): void {
    const toast: Toast = {
      id: this.generateId(),
      message,
      type,
      duration: duration || this.defaultDuration,
      action
    };

    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, toast]);

    // Auto-dismiss après la durée spécifiée
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        this.dismiss(toast.id);
      }, toast.duration);
    }
  }

  success(message: string, duration?: number, action?: Toast['action']): void {
    this.show(message, 'success', duration, action);
  }

  error(message: string, duration?: number, action?: Toast['action']): void {
    this.show(message, 'error', duration || 7000, action); // Erreurs restent plus longtemps
  }

  warning(message: string, duration?: number, action?: Toast['action']): void {
    this.show(message, 'warning', duration, action);
  }

  info(message: string, duration?: number, action?: Toast['action']): void {
    this.show(message, 'info', duration, action);
  }

  dismiss(id: string): void {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next(currentToasts.filter(toast => toast.id !== id));
  }

  clear(): void {
    this.toastsSubject.next([]);
  }

  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

