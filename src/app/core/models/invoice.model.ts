export interface Invoice {
  id: number;
  invoice_number: string;
  sale: number;
  issue_date: string;
  due_date?: string;
  seller_info: any;
  customer_name: string;
  customer_info?: any;
  items: any[];
  subtotal: number;
  tax: number;
  total: number;
  payment_status: string;
  status: 'GENERATED' | 'SENT' | 'PAID' | 'CANCELLED';
  notes?: string;
  pdf_file?: string;
  created_at: string;
  updated_at: string;
}

