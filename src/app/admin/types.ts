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
  verification_documents?: {
    government_id?: string;
    business_permit?: string;
  };
} 