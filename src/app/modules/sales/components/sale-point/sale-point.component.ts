import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { SaleService } from '../../../../core/services/sale.service';

@Component({
  selector: 'app-sale-point',
  standalone: true,
  template: '<div>Redirection vers la session de vente...</div>'
})
export class SalePointComponent {
  constructor(
    private router: Router,
    private authService: AuthService,
    private saleService: SaleService
  ) {
    // Rediriger vers une session active ou créer une nouvelle session
    const user = this.authService.getCurrentUser();
    if (user?.shop) {
      this.saleService.getActiveSessions(user.id).subscribe({
        next: (sessions) => {
          if (sessions.length > 0) {
            this.router.navigate(['/sales/sell', sessions[0].id]);
          } else {
            this.router.navigate(['/sales/create']);
          }
        },
        error: () => {
          this.router.navigate(['/sales/create']);
        }
      });
    } else {
      this.router.navigate(['/sales/sessions']);
    }
  }
}

