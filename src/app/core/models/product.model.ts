export interface Product {
  id: number;
  sku?: string;
  name: string;
  description?: string;
  category: number;
  unit: string;
  purchase_price: number;
  selling_price: number;
  image?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

