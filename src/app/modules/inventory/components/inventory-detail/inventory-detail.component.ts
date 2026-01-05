import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InventoryService, Inventory, StockMovement } from '../../../../core/services/inventory.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-inventory-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './inventory-detail.component.html',
  styleUrl: './inventory-detail.component.css'
})
export class InventoryDetailComponent implements OnInit {
  inventoryId!: number;
  item: Inventory | null = null;
  movements: StockMovement[] = [];
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inventoryService: InventoryService,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.inventoryId = +this.route.snapshot.paramMap.get('id')!;
    this.loadInventoryItem();
  }

  loadInventoryItem() {
    this.isLoading = true;
    this.inventoryService.getInventory(this.inventoryId).subscribe({
      next: (item) => {
        this.item = item;
        this.isLoading = false;
        // Charger les mouvements après avoir chargé l'item
        if (item) {
          this.loadMovements();
        }
      },
      error: (error) => {
        this.toastService.error('Article d\'inventaire non trouvé');
        console.error(error);
        this.isLoading = false;
        this.router.navigate(['/inventory']);
      }
    });
  }

  loadMovements() {
    if (!this.item) return;

    // S'assurer que product est un nombre (ID)
    const productId = typeof this.item.product === 'object'
      ? (this.item.product as any).id
      : this.item.product;

    this.inventoryService.getMovementsList({
      product: productId
    }).subscribe({
      next: (movements) => {
        this.movements = movements;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des mouvements', error);
      }
    });
  }

  getMovementTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'entry': 'Entrée',
      'exit': 'Sortie',
      'adjustment': 'Ajustement'
    };
    return labels[type] || type;
  }

  getMovementTypeClass(type: string): string {
    return `movement-type ${type}`;
  }

  getAttributeKeys(): string[] {
    // Les attributs sont dans le produit, pas dans l'inventaire
    // Cette méthode n'est plus utilisée mais conservée pour éviter les erreurs
    return [];
  }

  getStockPercentage(): number {
    if (!this.item) return 0;
    if (this.item.min_quantity === 0) return this.item.quantity > 0 ? 100 : 0;
    const maxStock = this.item.min_quantity * 3; // Considérer 3x le minimum comme 100%
    return Math.min((this.item.quantity / maxStock) * 100, 100);
  }

  getStockStatus(): string {
    if (!this.item) return 'N/A';
    if (this.item.quantity === 0) return 'Rupture de stock';
    if (this.item.is_low_stock) return 'Stock faible';
    return 'En stock';
  }
}
