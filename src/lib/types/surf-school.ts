// Surf School Types
// Based on the implementation plan schema and design brief requirements

export type SurfSchoolStatus = 'pending_verification' | 'active' | 'suspended' | 'rejected';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'all';

export type SurfSchoolLocation = 'General Luna' | 'Cloud 9' | 'Pilar' | 'Pacifico' | 'Dapa' | 'Union';

export interface SurfSchoolContact {
  phone_number?: string;
  whatsapp?: string;
  email?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
}

export interface SurfSchoolService {
  id: string;
  school_id: string;
  service_name: string;
  description?: string;
  price_per_hour: number;
  duration_hours: number;
  max_students: number;
  skill_level: SkillLevel;
  equipment_included: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface SurfSchoolImage {
  id: string;
  school_id: string;
  image_url: string;
  caption?: string;
  is_featured: boolean;
  display_order: number;
  created_at: string;
}

export interface SurfSchool {
  id: string;
  owner_id: string;
  
  // Basic information
  name: string;
  description?: string;
  instructor_name?: string;
  experience_years?: number;
  
  // Contact information
  contact: SurfSchoolContact;
  
  // Location
  location?: SurfSchoolLocation;
  address?: string;
  city: string;
  latitude?: number;
  longitude?: number;
  location_area?: string;
  
  // Media
  logo_url?: string;
  banner_url?: string;
  banner_position_x?: number;
  banner_position_y?: number;
  
  // System fields
  is_verified: boolean;
  is_active: boolean;
  status: SurfSchoolStatus;
  created_at: string;
  updated_at: string;
  
  // Relations
  services: SurfSchoolService[];
  images: SurfSchoolImage[];
  
  // Computed fields for display
  average_rating?: number;
  review_count?: number;
  starting_price?: number;
  featured_image?: string;
}

// Card component props interface
export interface SurfSchoolCardProps {
  id: string;
  name: string;
  instructor_name?: string;
  experience_years?: number;
  location?: SurfSchoolLocation;
  description?: string;
  images: string[];
  services: SurfSchoolService[];
  contact: SurfSchoolContact;
  is_verified: boolean;
  average_rating?: number;
  review_count?: number;
  starting_price?: number;
  featured_image?: string;
  created_at: string;
  onContactClick?: (type: 'whatsapp' | 'phone' | 'instagram' | 'facebook' | 'website', value: string) => void;
  onViewProfileClick?: () => void;
}

// Filter interfaces
export interface SurfSchoolFilters {
  location?: SurfSchoolLocation;
  skill_levels?: SkillLevel[];
  price_min?: number;
  price_max?: number;
  verified_only?: boolean;
  min_rating?: number;
  search?: string;
  sort_by?: 'rating_desc' | 'price_asc' | 'price_desc' | 'experience_desc' | 'newest';
  page?: number;
  limit?: number;
}

// Browse response interface
export interface SurfSchoolBrowseResponse {
  schools: SurfSchool[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    locations: SurfSchoolLocation[];
    skill_levels: SkillLevel[];
    price_range: {
      min: number;
      max: number;
    };
  };
}

// Registration form interfaces
export interface SurfSchoolRegistrationForm {
  // Basic info
  name: string;
  description: string;
  instructor_name: string;
  experience_years: number;
  
  // Contact
  phone_number: string;
  whatsapp: string;
  email: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  
  // Location
  location: SurfSchoolLocation;
  address: string;
  
  // Services
  services: Omit<SurfSchoolService, 'id' | 'school_id' | 'created_at' | 'updated_at'>[];
  
  // Images
  images: {
    file: File;
    caption?: string;
    is_featured: boolean;
  }[];
}

// Dashboard interfaces
export interface SurfSchoolDashboardStats {
  total_views: number;
  total_contacts: number;
  total_services: number;
  total_images: number;
  average_rating: number;
  recent_contacts: {
    date: string;
    type: 'whatsapp' | 'phone' | 'instagram' | 'facebook' | 'website';
    count: number;
  }[];
}