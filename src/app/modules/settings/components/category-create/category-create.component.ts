import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-category-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-create.component.html',
  styleUrl: './category-create.component.css'
})
export class CategoryCreateComponent {
  category = {
    name: '',
    description: '',
    is_active: true
  };

  isLoading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private productService: ProductService,
    private toastService: ToastService
  ) {}

  onSubmit() {
    if (this.isFormValid()) {
      this.isLoading = true;
      this.errorMessage = '';

      this.productService.createCategory(this.category).subscribe({
        next: () => {
          this.toastService.success('Catégorie créée avec succès !');
          this.router.navigate(['/settings/categories']);
        },
        error: (error) => {
          this.errorMessage = error.error?.error || error.error?.detail || 'Erreur lors de la création de la catégorie';
          this.isLoading = false;
        }
      });
    }
  }

  isFormValid(): boolean {
    return !!this.category.name;
  }

  cancel() {
    this.router.navigate(['/settings/categories']);
  }
}

