# Siargao Rides - Vehicle Rental Directory Codebase Overview

This document provides a comprehensive overview of the Siargao Rides codebase to help AI agents and developers understand the project structure, architecture, and key components.

## 🏝️ Project Overview

Siargao Rides is a modern web application that connects local vehicle rental shops in Siargao Island, Philippines, with tourists looking to rent motorcycles, cars, and tuktuks. The platform allows tourists to search, filter, and book vehicles while enabling shop owners to manage their listings and receive bookings.

### Core Features

- **For Tourists:**
  - Search and filter vehicles by type, location, price, and availability
  - Browse detailed shop profiles with photos and reviews
  - Make reservations directly through the platform
  - Manage bookings and favorites

- **For Shop Owners:**
  - Create and manage shop profiles
  - List and manage vehicle inventory
  - Receive and manage bookings
  - Respond to reviews

## 🧰 Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Styling:** TailwindCSS with custom theming
- **UI Components:** Custom components with ShadCN UI principles
- **Animation:** Framer Motion
- **Backend:** Supabase (PostgreSQL database, authentication, storage)
- **Form Validation:** Zod
- **Date Handling:** date-fns
- **Notifications:** react-hot-toast, sonner

## 📁 Project Structure

```
siargao-rides/
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js App Router pages
│   │   ├── browse/      # Browse listings page
│   │   ├── contact/     # Contact page
│   │   ├── dashboard/   # User & shop owner dashboard
│   │   ├── register/    # Shop registration
│   │   ├── shop/[id]/   # Individual shop page
│   │   ├── globals.css  # Global styles
│   │   ├── layout.tsx   # Root layout with Navbar/Footer
│   │   └── page.tsx     # Homepage
│   ├── components/      # Reusable components
│   │   ├── layout/      # Layout components (Navbar, Footer)
│   │   ├── shop/        # Shop-related components
│   │   ├── ui/          # UI components (Button, Badge, etc.)
│   │   ├── VehicleCard.tsx # Vehicle listing card
│   │   ├── SearchBar.tsx   # Search component
│   │   └── RentalShopCard.tsx # Shop listing card
│   ├── contexts/        # React contexts (Auth, etc.)
│   ├── lib/             # Utility functions and API
│   │   ├── api.ts       # API functions for Supabase
│   │   ├── service.ts   # Service layer (uses API or mock data)
│   │   ├── supabase.ts  # Supabase client setup
│   │   ├── types.ts     # TypeScript type definitions
│   │   └── utils.ts     # Utility functions
│   └── types/           # TypeScript type declarations
├── scripts/             # Utility scripts (DB setup, etc.)
├── supabase/            # Supabase configuration
├── tailwind.config.js   # TailwindCSS configuration
└── next.config.ts       # Next.js configuration
```

## 🏗️ Architecture

### Frontend Architecture

The application follows a component-based architecture with Next.js App Router:

1. **Pages:** Located in `src/app/`, following Next.js App Router conventions
2. **Components:** Reusable UI elements in `src/components/`
3. **Contexts:** Global state management in `src/contexts/`
4. **Hooks:** Custom React hooks for shared logic

### Backend Architecture

The backend is built on Supabase, providing:

1. **Database:** PostgreSQL database with tables for users, shops, vehicles, bookings, etc.
2. **Authentication:** User authentication and authorization
3. **Storage:** File storage for vehicle and shop images
4. **API:** RESTful API endpoints for CRUD operations

### Data Flow

1. **Client-side:** Components make requests to service layer
2. **Service Layer:** `src/lib/service.ts` handles business logic and decides whether to use mock data or real API
3. **API Layer:** `src/lib/api.ts` makes direct calls to Supabase
4. **Database:** Supabase PostgreSQL database stores and retrieves data

## 📊 Data Models

### Core Entities

#### User
```typescript
type User = {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone_number?: string
  avatar_url?: string
  role: 'tourist' | 'shop_owner' | 'admin'
  created_at: string
  updated_at: string
}
```

#### RentalShop
```typescript
type RentalShop = {
  id: string
  owner_id: string
  name: string
  description?: string
  address: string
  city: string
  latitude?: number
  longitude?: number
  phone_number?: string
  whatsapp?: string
  email?: string
  opening_hours?: OpeningHours
  logo_url?: string
  banner_url?: string
  is_verified: boolean
  location_area?: string
  offers_delivery?: boolean
  delivery_fee?: number
  requires_id_deposit?: boolean
  requires_cash_deposit?: boolean
  cash_deposit_amount?: number
  created_at: string
  updated_at: string
}
```

#### Vehicle
```typescript
type Vehicle = {
  id: string
  shop_id: string
  vehicle_type_id: string
  vehicle_type: VehicleType  // 'motorcycle' | 'car' | 'tuktuk'
  name: string
  description?: string
  category: VehicleCategory
  price_per_day: number
  price_per_week?: number
  price_per_month?: number
  is_available: boolean
  specifications?: VehicleSpecifications
  color?: string
  year?: number
  license_plate?: string
  seats?: number
  transmission?: 'manual' | 'automatic'
  fuel_type?: 'gasoline' | 'diesel' | 'electric' | 'hybrid'
  doors?: number
  air_conditioning?: boolean
  created_at: string
  updated_at: string
  images?: VehicleImage[]
}
```

#### Rental (Booking)
```typescript
type Rental = {
  id: string
  vehicle_id: string
  vehicle_type_id: string
  user_id: string
  shop_id: string
  start_date: string
  end_date: string
  total_price: number
  status: RentalStatus  // 'booked' | 'in_progress' | 'completed' | 'cancelled'
  payment_status: PaymentStatus  // 'pending' | 'paid' | 'refunded' | 'cancelled'
  created_at: string
  updated_at: string
}
```

## 🔐 Authentication & Authorization

The application uses Supabase Authentication with the following user roles:

1. **Tourist:** Regular users who can browse and book vehicles
2. **Shop Owner:** Users who can manage their shop and vehicle listings
3. **Admin:** Users with full access to manage the platform

Authentication is managed through the `AuthContext` in `src/contexts/AuthContext.tsx`, which provides:

- User session management
- Sign in/sign out functionality
- Registration
- Password reset
- Google authentication

## 🖼️ UI Components

The application uses a custom UI component library built on ShadCN UI principles:

- **Button:** `src/components/ui/Button.tsx`
- **Input:** `src/components/ui/Input.tsx`
- **Calendar:** `src/components/ui/Calendar.tsx`
- **DatePicker:** `src/components/ui/DatePicker.tsx`
- **Badge:** `src/components/ui/Badge.tsx`
- And many more...

## 🌐 API Integration

The application interacts with Supabase through two main layers:

1. **API Layer (`src/lib/api.ts`):** Direct calls to Supabase
2. **Service Layer (`src/lib/service.ts`):** Business logic that can use either the API or mock data

Key API functions include:

- `getShops()`: Fetch all rental shops
- `getVehicles()`: Fetch vehicles with optional filters
- `createVehicle()`: Create a new vehicle listing
- `createRental()`: Create a new booking
- `getCurrentUser()`: Get the currently authenticated user

## 🔄 State Management

The application uses React Context for global state management:

- **AuthContext:** Manages user authentication state
- **Component-level state:** Local state for UI components

## 📱 Responsive Design

The application follows a mobile-first approach with responsive design principles:

- Tailwind's responsive classes (`sm:`, `md:`, `lg:`, etc.)
- Custom responsive components
- Adaptive layouts for different screen sizes

## 🧪 Testing

The application is set up for testing with:

- Unit tests for utility functions
- Component tests for UI components
- Integration tests for key user flows

## 🚀 Deployment

The application is designed to be deployed on Vercel or similar platforms, with:

- Environment variables for configuration
- Supabase for backend services
- Next.js optimizations for performance

## 🔍 Search and Filtering

The application provides robust search and filtering capabilities:

- Search by vehicle name, description, or category
- Filter by vehicle type (motorcycle, car, tuktuk)
- Filter by price range
- Filter by availability
- Filter by location
- Sort by price, rating, or distance

## 📅 Booking System

The booking system allows users to:

- Select dates for rental
- Calculate total price based on duration
- Submit booking requests
- Manage existing bookings
- Cancel bookings

## 🌟 Development Roadmap

The project follows this development plan:

1. **Phase 1:** Core UI components and structure ✅
2. **Phase 2:** Complete all page templates and navigation ✅
3. **Phase 3:** Add search and filtering functionality ✅
4. **Phase 4:** Implement forms and user interactions ✅
5. **Phase 5:** Connect to backend (Supabase) ✅
6. **Phase 6:** Authentication and user roles ✅
7. **Phase 7:** Booking system and notifications ✅
8. **Phase 8:** Reviews and ratings ✅
9. **Phase 9:** Payment integration 🔄
10. **Phase 10:** Testing and deployment 🔄

## 🧩 Key Patterns and Conventions

### Naming Conventions

- **Components:** PascalCase (e.g., `VehicleCard.tsx`)
- **Utilities:** camelCase (e.g., `formatDate.ts`)
- **Files:** kebab-case for pages (e.g., `vehicle-details.tsx`)
- **CSS Classes:** Tailwind utility classes with BEM-like naming for custom classes

### Code Organization

- **Component Structure:** Each component has its own file
- **Page Structure:** Each page has its own directory with related components
- **API Structure:** API functions are organized by entity (users, shops, vehicles, etc.)

### Error Handling

- Try/catch blocks for API calls
- Error messages displayed to users
- Fallback UI for error states

## 🔧 Environment Setup

To set up the development environment:

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up environment variables in `.env.local`
4. Run the development server with `npm run dev`

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (for admin operations)

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)

## 🤝 Contributing Guidelines

When contributing to this project:

1. **Follow the existing code style** - Use TypeScript for type safety
2. **Mobile-first approach** - Always design with mobile in mind first
3. **Component-based architecture** - Create reusable components
4. **Performance optimizations** - Lazy loading, code splitting when appropriate
5. **Accessibility** - Ensure components are accessible

## 🔒 Security Considerations

- Authentication is handled by Supabase
- Row-level security policies in Supabase control data access
- Client-side validation is complemented by server-side validation
- Environment variables are used for sensitive information
