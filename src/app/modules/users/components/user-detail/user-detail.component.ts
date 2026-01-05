import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { UserService } from '../../../../core/services/user.service';
import { User } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyFormatPipe],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.css'
})
export class UserDetailComponent implements OnInit {
  user: User | undefined;
  userId!: number;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.userId = +this.route.snapshot.paramMap.get('id')!;
    this.loadUser();
  }

  loadUser() {
    this.isLoading = true;
    this.userService.getUser(this.userId).subscribe({
      next: (user) => {
        this.user = user;
        this.isLoading = false;
      },
      error: (error) => {
        this.toastService.error('Utilisateur non trouvé !');
        console.error(error);
        this.router.navigate(['/users']);
      }
    });
  }

  getRoleLabel(role: 'admin' | 'seller'): string {
    return role === 'admin' ? 'Administrateur' : 'Vendeur';
  }

  getRoleClass(role: 'admin' | 'seller'): string {
    return role === 'admin' ? 'role-admin' : 'role-seller';
  }

  contactUser(): void {
    if (this.user?.email) {
      this.toastService.info(`Email: ${this.user.email}`, 7000);
    } else if (this.user?.phone) {
      this.toastService.info(`Téléphone: ${this.user.phone}`, 7000);
    } else {
      this.toastService.warning('Aucune information de contact disponible.');
    }
  }
}
