export interface RentalShop {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  phone_number: string | null;
  whatsapp: string | null;
  email: string | null;
  logo_url: string | null;
  banner_url: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  owner_id: string;
  location_area: string | null;
  offers_delivery: boolean;
  delivery_fee: number;
  subscription_status?: 'active' | 'inactive' | 'expired';
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  is_active?: boolean;
  requires_id_deposit?: boolean;
  requires_cash_deposit?: boolean;
  cash_deposit_amount?: number;
  facebook_url?: string | null;
  instagram_url?: string | null;
  sms_number?: string | null;
}

export interface ShopWithSubscription extends RentalShop {
  subscription_status: 'active' | 'inactive' | 'expired';
  subscription_start_date: string | null;
  subscription_end_date: string | null;
} 