import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService, ConfirmationOptions } from '../../../core/services/confirmation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.css'
})
export class ConfirmationDialogComponent implements OnInit, OnDestroy {
  show = false;
  options: ConfirmationOptions = {
    title: 'Confirmation',
    message: '',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    type: 'info'
  };
  private resolve?: (value: boolean) => void;
  private subscription?: Subscription;

  constructor(private confirmationService: ConfirmationService) {}

  ngOnInit() {
    this.subscription = this.confirmationService.confirmation$.subscribe(({ options, resolve }) => {
      this.options = {
        title: options.title || 'Confirmation',
        message: options.message,
        confirmText: options.confirmText || 'Confirmer',
        cancelText: options.cancelText || 'Annuler',
        type: options.type || 'info'
      };
      this.resolve = resolve;
      this.show = true;
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  onConfirm() {
    if (this.resolve) {
      this.resolve(true);
      this.resolve = undefined;
    }
    this.show = false;
  }

  onCancel() {
    if (this.resolve) {
      this.resolve(false);
      this.resolve = undefined;
    }
    this.show = false;
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }
}

