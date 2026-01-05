import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface ConfirmationOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  private confirmationSubject = new Subject<{ options: ConfirmationOptions; resolve: (value: boolean) => void }>();
  public confirmation$ = this.confirmationSubject.asObservable();

  confirm(options: ConfirmationOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.confirmationSubject.next({ options, resolve });
    });
  }

  // Méthode helper pour les confirmations simples
  confirmDelete(itemName?: string): Promise<boolean> {
    return this.confirm({
      title: 'Confirmer la suppression',
      message: itemName 
        ? `Êtes-vous sûr de vouloir supprimer ${itemName} ?`
        : 'Êtes-vous sûr de vouloir supprimer cet élément ?',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger'
    });
  }
}

