export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'Admin' | 'Vendeur';
  shop?: number;
  is_active: boolean;
  date_joined: string;
  last_login?: string;
}

