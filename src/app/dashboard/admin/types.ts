/**
 * Admin-specific type definitions
 */

// Type for rental shops with verification status
export interface VerifiableRentalShop {
  id: string;
  name: string;
  description?: string | null;
  address: string;
  city: string;
  email?: string | null;
  phone_number?: string | null;
  whatsapp?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  owner?: {
    id: string;
    email: string;
    first_name?: string | null;
    last_name?: string | null;
    avatar_url?: string | null;
    phone_number?: string | null;
  };
}

// Type for shops with subscription information
export interface ManageableSubscription {
  id: string;
  name: string;
  logo_url?: string | null;
  is_verified: boolean;
  is_active: boolean;
  is_showcase?: boolean;
  subscription_status: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  created_at: string;
  updated_at: string;
  owner?: {
    id: string;
    email: string;
    first_name?: string | null;
    last_name?: string | null;
  };
} 