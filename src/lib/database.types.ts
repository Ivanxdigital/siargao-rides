import { BikeCategory, PaymentStatus, RentalStatus, VehicleType } from "./types";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          first_name: string | null
          last_name: string | null
          phone_number: string | null
          avatar_url: string | null
          role: 'tourist' | 'shop_owner' | 'admin'
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          email: string
          first_name?: string | null
          last_name?: string | null
          phone_number?: string | null
          avatar_url?: string | null
          role?: 'tourist' | 'shop_owner' | 'admin'
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          phone_number?: string | null
          avatar_url?: string | null
          role?: 'tourist' | 'shop_owner' | 'admin'
        }
      }
      rental_shops: {
        Row: {
          id: string
          owner_id: string
          name: string
          description: string | null
          address: string
          city: string
          latitude: number | null
          longitude: number | null
          phone_number: string | null
          whatsapp: string | null
          email: string | null
          opening_hours: Json | null
          logo_url: string | null
          banner_url: string | null
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          description?: string | null
          address: string
          city: string
          latitude?: number | null
          longitude?: number | null
          phone_number?: string | null
          whatsapp?: string | null
          email?: string | null
          opening_hours?: Json | null
          logo_url?: string | null
          banner_url?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          description?: string | null
          address?: string
          city?: string
          latitude?: number | null
          longitude?: number | null
          phone_number?: string | null
          whatsapp?: string | null
          email?: string | null
          opening_hours?: Json | null
          logo_url?: string | null
          banner_url?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bikes: {
        Row: {
          id: string
          shop_id: string
          name: string
          description: string | null
          category: BikeCategory
          price_per_day: number
          price_per_week: number | null
          price_per_month: number | null
          is_available: boolean
          specifications: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          name: string
          description?: string | null
          category: BikeCategory
          price_per_day: number
          price_per_week?: number | null
          price_per_month?: number | null
          is_available?: boolean
          specifications?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          name?: string
          description?: string | null
          category?: BikeCategory
          price_per_day?: number
          price_per_week?: number | null
          price_per_month?: number | null
          is_available?: boolean
          specifications?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      bike_images: {
        Row: {
          id: string
          bike_id: string
          image_url: string
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          bike_id: string
          image_url: string
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          bike_id?: string
          image_url?: string
          is_primary?: boolean
          created_at?: string
        }
      }
      rentals: {
        Row: {
          id: string
          vehicle_id: string
          vehicle_type_id: string
          user_id: string
          shop_id: string
          start_date: string
          end_date: string
          total_price: number
          status: RentalStatus
          payment_status: PaymentStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          vehicle_type_id: string
          user_id: string
          shop_id: string
          start_date: string
          end_date: string
          total_price: number
          status?: RentalStatus
          payment_status?: PaymentStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          vehicle_type_id?: string
          user_id?: string
          shop_id?: string
          start_date?: string
          end_date?: string
          total_price?: number
          status?: RentalStatus
          payment_status?: PaymentStatus
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          shop_id: string
          vehicle_id: string | null
          vehicle_type_id: string | null
          user_id: string
          rental_id: string
          rating: number
          comment: string | null
          reply: string | null
          reply_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          vehicle_id?: string | null
          vehicle_type_id?: string | null
          user_id: string
          rental_id: string
          rating: number
          comment?: string | null
          reply?: string | null
          reply_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          vehicle_id?: string | null
          vehicle_type_id?: string | null
          user_id?: string
          rental_id?: string
          rating?: number
          comment?: string | null
          reply?: string | null
          reply_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          vehicle_id: string
          vehicle_type_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          vehicle_id: string
          vehicle_type_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          vehicle_id?: string
          vehicle_type_id?: string
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          vehicle_type_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          vehicle_type_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          vehicle_type_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      vehicle_types: {
        Row: {
          id: string
          name: VehicleType
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: VehicleType
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: VehicleType
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          shop_id: string
          vehicle_type_id: string
          name: string
          description: string | null
          category_id: string
          price_per_day: number
          price_per_week: number | null
          price_per_month: number | null
          is_available: boolean
          specifications: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          vehicle_type_id: string
          name: string
          description?: string | null
          category_id: string
          price_per_day: number
          price_per_week?: number | null
          price_per_month?: number | null
          is_available?: boolean
          specifications?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          vehicle_type_id?: string
          name?: string
          description?: string | null
          category_id?: string
          price_per_day?: number
          price_per_week?: number | null
          price_per_month?: number | null
          is_available?: boolean
          specifications?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      vehicle_images: {
        Row: {
          id: string
          vehicle_id: string
          image_url: string
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          image_url: string
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          image_url?: string
          is_primary?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 