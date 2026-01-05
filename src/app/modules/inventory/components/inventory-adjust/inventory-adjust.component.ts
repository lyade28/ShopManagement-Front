import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InventoryService, Inventory, StockAdjustment } from '../../../../core/services/inventory.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-inventory-adjust',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory-adjust.component.html',
  styleUrl: './inventory-adjust.component.css'
})
export class InventoryAdjustComponent implements OnInit {
  inventoryId!: number;
  inventory: Inventory | null = null;
  productName: string = '';
  currentStock: number = 0;
  isLoading = false;
  
  adjustmentType: 'entry' | 'exit' | 'adjustment' = 'adjustment';
  adjustment: StockAdjustment = {
    inventory_id: 0,
    quantity: 0,
    reason: '',
    notes: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inventoryService: InventoryService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.inventoryId = +this.route.snapshot.paramMap.get('id')!;
    this.loadInventoryItem();
  }

  loadInventoryItem() {
    this.isLoading = true;
    this.inventoryService.getInventory(this.inventoryId).subscribe({
      next: (item) => {
        this.inventory = item;
        this.productName = item.product_name || 'Produit';
        // S'assurer que currentStock est un nombre
        this.currentStock = Number(item.quantity) || 0;
        this.adjustment.inventory_id = item.id;
        this.isLoading = false;
      },
      error: (error) => {
        this.toastService.error('Article d\'inventaire non trouvé');
        console.error(error);
        this.isLoading = false;
        this.router.navigate(['/inventory']);
      }
    });
  }

  onSubmit() {
    if (this.isFormValid()) {
      this.isLoading = true;
      
      // Convertir la quantité en nombre pour éviter les problèmes de concaténation
      const adjustmentQuantity = Number(this.adjustment.quantity) || 0;
      const currentStockNum = Number(this.currentStock) || 0;
      
      // Calculer la nouvelle quantité totale selon le type d'ajustement
      let newQuantity: number;
      if (this.adjustmentType === 'entry') {
        newQuantity = currentStockNum + Math.abs(adjustmentQuantity);
      } else if (this.adjustmentType === 'exit') {
        newQuantity = Math.max(0, currentStockNum - Math.abs(adjustmentQuantity));
      } else {
        // adjustment: quantité directement définie
        newQuantity = adjustmentQuantity;
      }
      
      // Arrondir à 2 décimales pour correspondre au DecimalField du backend
      newQuantity = Math.round(newQuantity * 100) / 100;
      
      // Préparer les données avec la nouvelle quantité totale
      const adjustmentData: StockAdjustment = {
        inventory_id: this.adjustment.inventory_id,
        quantity: newQuantity,
        reason: this.adjustment.reason.trim(),
        notes: this.adjustment.notes?.trim() || undefined
      };
      
      console.log('Données d\'ajustement envoyées:', adjustmentData);
      
      this.inventoryService.adjustStock(adjustmentData).subscribe({
        next: () => {
          this.toastService.success('Stock ajusté avec succès !');
          if (this.inventoryId) {
            this.router.navigate(['/inventory/detail', this.inventoryId]);
          } else {
            this.router.navigate(['/inventory']);
          }
        },
        error: (error) => {
          console.error('Erreur d\'ajustement complète:', error);
          const errorDetail = error.error?.errors || error.error?.detail || error.error;
          const errorMessage = typeof errorDetail === 'string' 
            ? errorDetail 
            : errorDetail?.quantity?.[0] || errorDetail?.reason?.[0] || 'Erreur lors de l\'ajustement du stock';
          this.toastService.error(errorMessage);
          this.isLoading = false;
        }
      });
    }
  }

  isFormValid(): boolean {
    return !!(
      this.adjustment.quantity !== 0 &&
      this.adjustment.quantity > 0 &&
      this.adjustment.reason &&
      this.adjustment.reason.trim() !== ''
    );
  }

  cancel() {
    this.router.navigate(['/inventory']);
  }

  getNewStock(): number {
    // Convertir en nombres pour éviter les problèmes de concaténation
    const adjustmentQuantity = Number(this.adjustment.quantity) || 0;
    const currentStockNum = Number(this.currentStock) || 0;
    
    if (this.adjustmentType === 'entry') {
      return currentStockNum + Math.abs(adjustmentQuantity);
    } else if (this.adjustmentType === 'exit') {
      return Math.max(0, currentStockNum - Math.abs(adjustmentQuantity));
    } else {
      return adjustmentQuantity;
    }
  }

  getStockPercentage(): number {
    if (!this.inventory || this.inventory.min_quantity === 0) return 100;
    const maxStock = (this.inventory.min_quantity || 0) * 3;
    return Math.min((this.currentStock / maxStock) * 100, 100);
  }

  getNewStockPercentage(): number {
    const newStock = this.getNewStock();
    if (!this.inventory || this.inventory.min_quantity === 0) return newStock > 0 ? 100 : 0;
    const maxStock = (this.inventory.min_quantity || 0) * 3;
    return Math.min((newStock / maxStock) * 100, 100);
  }

  getAdjustmentQuantity(): number {
    return Math.abs(Number(this.adjustment.quantity) || 0);
  }
}

