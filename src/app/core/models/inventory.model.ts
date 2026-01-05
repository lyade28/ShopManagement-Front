export interface Inventory {
  id: number;
  product: number;
  shop: number;
  quantity: number;
  min_quantity: number;
  max_quantity?: number;
  location?: string;
  last_restocked_at?: string;
  updated_at: string;
}

export interface StockMovement {
  id: number;
  product: number;
  shop: number;
  movement_type: 'ENTRY' | 'EXIT';
  quantity: number;
  reason: string;
  reference?: number;
  user: number;
  notes?: string;
  created_at: string;
}

