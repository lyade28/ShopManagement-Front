import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService, Category, Attribute } from '../../../../core/services/product.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';

interface AttributeForm {
  id?: number;
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  required: boolean;
  options?: string[];
  placeholder?: string;
  order: number;
}

@Component({
  selector: 'app-category-attributes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './category-attributes.component.html',
  styleUrl: './category-attributes.component.css'
})
export class CategoryAttributesComponent implements OnInit {
  categoryId!: number;
  categoryName: string = '';
  isLoading = false;

  attributes: Attribute[] = [];
  newAttribute: AttributeForm = {
    name: '',
    label: '',
    type: 'text',
    required: false,
    options: [],
    placeholder: '',
    order: 0
  };

  showAddForm: boolean = false;
  editingIndex: number | null = null;

  attributeTypes = [
    { value: 'text', label: 'Texte' },
    { value: 'number', label: 'Nombre' },
    { value: 'select', label: 'Liste déroulante' },
    { value: 'textarea', label: 'Zone de texte' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.categoryId = +this.route.snapshot.paramMap.get('id')!;
    this.loadCategory();
  }

  loadCategory() {
    this.isLoading = true;
    this.productService.getCategory(this.categoryId).subscribe({
      next: (category) => {
        this.categoryName = category.name;
        this.isLoading = false;
        this.loadAttributes();
      },
      error: (error) => {
        this.toastService.error('Catégorie non trouvée');
        console.error(error);
        this.isLoading = false;
        this.router.navigate(['/settings/categories']);
      }
    });
  }

  loadAttributes() {
    this.productService.getCategoryAttributes(this.categoryId).subscribe({
      next: (attributes) => {
        this.attributes = attributes.sort((a, b) => (a.order || 0) - (b.order || 0));
      },
      error: (error) => {
        console.error('Erreur lors du chargement des attributs', error);
        this.attributes = [];
      }
    });
  }

  onTypeChange() {
    if (this.newAttribute.type !== 'select') {
      this.newAttribute.options = [];
    } else if (!this.newAttribute.options || this.newAttribute.options.length === 0) {
      this.newAttribute.options = [''];
    }
  }

  addOption() {
    if (!this.newAttribute.options) {
      this.newAttribute.options = [];
    }
    this.newAttribute.options.push('');
  }

  removeOption(index: number) {
    if (this.newAttribute.options) {
      this.newAttribute.options.splice(index, 1);
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  startAdd() {
    this.newAttribute = {
      name: '',
      label: '',
      type: 'text',
      required: false,
      options: [],
      placeholder: '',
      order: this.attributes.length + 1
    };
    this.showAddForm = true;
    this.editingIndex = null;
  }

  startEdit(index: number) {
    this.newAttribute = { ...this.attributes[index] };
    if (this.newAttribute.type === 'select' && !this.newAttribute.options) {
      this.newAttribute.options = [];
    }
    this.showAddForm = true;
    this.editingIndex = index;
  }

  cancelEdit() {
    this.showAddForm = false;
    this.editingIndex = null;
    this.newAttribute = {
      name: '',
      label: '',
      type: 'text',
      required: false,
      options: [],
      placeholder: '',
      order: 0
    };
  }

  saveAttribute() {
    if (!this.isAttributeValid()) {
      return;
    }

    const attributeData: Partial<Attribute> = {
      ...this.newAttribute
    };

    if (this.editingIndex !== null && this.attributes[this.editingIndex].id) {
      // Modifier un attribut existant
      this.productService.updateCategoryAttribute(
        this.categoryId,
        this.attributes[this.editingIndex].id!,
        attributeData
      ).subscribe({
        next: (updatedAttribute) => {
          this.attributes[this.editingIndex!] = updatedAttribute;
          this.cancelEdit();
          this.toastService.success('Attribut mis à jour avec succès !');
        },
        error: (error) => {
          this.toastService.error('Erreur lors de la mise à jour de l\'attribut');
          console.error(error);
        }
      });
    } else {
      // Ajouter un nouvel attribut
      this.productService.createCategoryAttribute(this.categoryId, attributeData).subscribe({
        next: (newAttribute) => {
          this.attributes.push(newAttribute);
          this.cancelEdit();
          this.toastService.success('Attribut créé avec succès !');
        },
        error: (error) => {
          this.toastService.error('Erreur lors de la création de l\'attribut');
          console.error(error);
        }
      });
    }
  }

  deleteAttribute(index: number) {
    const attribute = this.attributes[index];
    if (!attribute.id) {
      this.attributes.splice(index, 1);
      return;
    }

    this.confirmationService.confirm({
      title: 'Supprimer l\'attribut',
      message: 'Êtes-vous sûr de vouloir supprimer cet attribut ?',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger'
    }).then(confirmed => {
      if (confirmed) {
        this.productService.deleteCategoryAttribute(this.categoryId, attribute.id).subscribe({
          next: () => {
            this.attributes.splice(index, 1);
            // Réorganiser l'ordre
            this.attributes.forEach((attr, i) => {
              attr.order = i + 1;
            });
            this.toastService.success('Attribut supprimé avec succès !');
          },
          error: (error) => {
            this.toastService.error('Erreur lors de la suppression de l\'attribut');
            console.error(error);
          }
        });
      }
    });
  }

  isAttributeValid(): boolean {
    if (!this.newAttribute.name || !this.newAttribute.label) {
      return false;
    }
    if (this.newAttribute.type === 'select' && (!this.newAttribute.options || this.newAttribute.options.length === 0)) {
      return false;
    }
    return true;
  }

  moveUp(index: number) {
    if (index > 0) {
      const temp = this.attributes[index];
      this.attributes[index] = this.attributes[index - 1];
      this.attributes[index - 1] = temp;
      
      // Mettre à jour les ordres
      this.attributes[index].order = index + 1;
      this.attributes[index - 1].order = index;
      
      // Sauvegarder les changements
      this.saveAttributeOrder();
    }
  }

  moveDown(index: number) {
    if (index < this.attributes.length - 1) {
      const temp = this.attributes[index];
      this.attributes[index] = this.attributes[index + 1];
      this.attributes[index + 1] = temp;
      
      // Mettre à jour les ordres
      this.attributes[index].order = index + 1;
      this.attributes[index + 1].order = index + 2;
      
      // Sauvegarder les changements
      this.saveAttributeOrder();
    }
  }

  saveAttributeOrder() {
    // Mettre à jour chaque attribut avec son nouvel ordre
    const updates = this.attributes.map((attr, idx) => 
      this.productService.updateAttribute(attr.id, { order: idx + 1 })
    );

    // Exécuter toutes les mises à jour en parallèle
    let completed = 0;
    let hasError = false;
    
    updates.forEach(update => {
      update.subscribe({
        next: () => {
          completed++;
          if (completed === updates.length && !hasError) {
            console.log('Ordre des attributs mis à jour');
          }
        },
        error: (error) => {
          if (!hasError) {
            hasError = true;
            console.error('Erreur lors de la mise à jour de l\'ordre', error);
            // Recharger les attributs en cas d'erreur
            this.loadAttributes();
          }
        }
      });
    });
  }

  getAttributeTypeLabel(type: string): string {
    const typeObj = this.attributeTypes.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
  }
}

