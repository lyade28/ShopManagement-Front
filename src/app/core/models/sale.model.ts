export interface Sale {
  id: number;
  sale_number: string;
  session: number;
  seller: number;
  shop: number;
  customer_name: string;
  customer_contact?: string;
  sale_date: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: 'ESPECES' | 'CARTE' | 'CHEQUE' | 'VIREMENT';
  payment_status: 'PAID' | 'PENDING' | 'PARTIAL';
  status: 'COMPLETED' | 'CANCELLED';
  invoice?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: number;
  sale: number;
  product: number;
  quantity: number;
  unit_price: number;
  discount: number;
  subtotal: number;
  created_at: string;
}

export interface SaleSession {
  id: number;
  session_number: string;
  seller: number;
  shop: number;
  start_time: string;
  end_time?: string;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  total_sales: number;
  created_at: string;
  updated_at: string;
}

