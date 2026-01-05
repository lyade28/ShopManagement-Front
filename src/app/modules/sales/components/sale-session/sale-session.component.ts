import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sale-session',
  standalone: true,
  template: '<div>Redirection vers les sessions de vente...</div>'
})
export class SaleSessionComponent {
  constructor(private router: Router) {
    // Rediriger vers la liste des sessions
    this.router.navigate(['/sales/sessions']);
  }
}

