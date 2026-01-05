import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-category-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-edit.component.html',
  styleUrl: './category-edit.component.css'
})
export class CategoryEditComponent implements OnInit {
  categoryId!: number;
  
  category = {
    name: '',
    description: '',
    is_active: true
  };

  isLoading = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.categoryId = +this.route.snapshot.paramMap.get('id')!;
    this.loadCategory();
  }

  loadCategory() {
    this.isLoading = true;
    this.productService.getCategory(this.categoryId).subscribe({
      next: (category) => {
        this.category = {
          name: category.name,
          description: category.description || '',
          is_active: category.is_active !== false
        };
        this.isLoading = false;
      },
      error: (error) => {
        this.toastService.error('Catégorie non trouvée');
        console.error(error);
        this.isLoading = false;
        this.router.navigate(['/settings/categories']);
      }
    });
  }

  onSubmit() {
    if (this.isFormValid()) {
      this.isLoading = true;
      this.errorMessage = '';

      this.productService.updateCategory(this.categoryId, this.category).subscribe({
        next: () => {
          this.toastService.success('Catégorie mise à jour avec succès !');
          this.router.navigate(['/settings/categories']);
        },
        error: (error) => {
          this.errorMessage = error.error?.error || error.error?.detail || 'Erreur lors de la mise à jour';
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

