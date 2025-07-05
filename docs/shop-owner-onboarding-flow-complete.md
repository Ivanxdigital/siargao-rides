# Siargao Rides - Shop Owner Onboarding Flow Documentation

> **Last Updated**: July 4, 2025  
> **System Version**: ONBOARDING_V3 (Quick Start Flow)  
> **Status**: Production Ready with Critical Gaps Identified

## Table of Contents

1. [System Overview](#system-overview)
2. [Current Implementation Analysis](#current-implementation-analysis)
3. [Critical Gaps Identified](#critical-gaps-identified)
4. [User Journey Flow](#user-journey-flow)
5. [Technical Implementation](#technical-implementation)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [File Structure Reference](#file-structure-reference)
9. [Missing Components](#missing-components)
10. [Implementation Recommendations](#implementation-recommendations)

---

## System Overview

The Shop Owner Onboarding System allows vehicle rental shop owners in Siargao to join the platform, complete verification, and start listing their vehicles. The current system uses **ONBOARDING_V3** (controlled by `ONBOARDING_V2` feature flag), which provides a revolutionary 2-minute quick start experience with immediate vehicle listing capability.

### Key Features ✅

- **2-Minute Quick Start**: Micro-onboarding with only 4 essential fields
- **Immediate Vehicle Listing**: Start listing vehicles without waiting for verification
- **Unverified Badge System**: Progressive trust with "Pending Verification" badges
- **Gamified Setup Progress**: Point-based achievement system with completion levels
- **Progressive Verification**: Optional document upload for verified badges
- **Mobile-First Design**: Optimized single-column forms for touch navigation
- **Admin Verification Portal**: Functional admin panel at `/dashboard/admin/verification`
- **Comprehensive API Layer**: 15+ shop-related endpoints with proper validation
- **File Storage Infrastructure**: Working Supabase storage with upload utilities

### Critical Issues ❌

- **Missing Shop Owner Verification Page**: `/dashboard/verification` returns 404 error
- **Outdated Database Types**: Missing fields from recent migrations
- **Incomplete File Upload Flow**: No UI for shop owners to upload documents
- **Database Type Misalignment**: Types don't match current schema

---

## Current Implementation Analysis

### Architecture Overview

The onboarding system follows a **two-tier progressive enhancement approach**:

1. **Quick Start Registration** (2 minutes): Immediate access with minimal data
2. **Progressive Setup** (ongoing): Gamified completion of additional features

### Feature Flag Configuration

**Location**: `src/lib/featureFlags.ts`
```typescript
export const featureFlags = {
  ONBOARDING_V2: getFeatureFlag('ONBOARDING_V2', true), // Default enabled
};
```

**Environment Variable**: `NEXT_PUBLIC_FEATURE_ONBOARDING_V2=true`

### Core Components

#### 1. QuickStartOnboarding (`src/components/shop/QuickStartOnboarding.tsx`)

**Purpose**: 2-step micro-onboarding card for rapid registration

**Features**:
- Framer Motion slide animations between steps
- React Hook Form + Zod validation for each step
- Mobile-optimized single-column layout
- Progress indicators and step navigation
- Immediate success feedback
- No document upload blocking

**Form Steps**:
- **Step 1 (30 seconds)**: Shop name, phone number
- **Step 2 (60 seconds)**: Location area, quick description

#### 2. ProgressiveSetupCard (`src/components/shop/ProgressiveSetupCard.tsx`)

**Purpose**: Gamified setup progress system with achievement levels

**Features**:
- Point-based task completion system (235 total points)
- Dynamic achievement levels with visual indicators
- Benefits preview for each task ("40% more customer trust")
- Smart task prioritization (shows 2-3 most important)
- Collapsible interface with progress persistence
- Auto-hides when 90%+ complete

**Gamification System**:
- ✅ Add Your First Vehicle (50 points) - "Start receiving bookings"
- ✅ Add Shop Logo (25 points) - "40% more customer trust"
- ✅ Add Shop Banner (25 points) - "Better visual appeal"
- ✅ Improve Description (20 points) - "Better search visibility"
- ✅ Verify Phone Number (15 points) - "Direct customer contact"
- ✅ Get Verified Badge (100 points) - "60% more bookings"

#### 3. VerificationBadge (`src/components/shop/VerificationBadge.tsx`)

**Purpose**: Visual trust indicators for shops and vehicles

**Badge Types**:
- **Verified**: Green checkmark for admin-approved shops
- **Pending Verification**: Amber clock for unverified but active shops  
- **Top Rated**: Gold star for highly-rated verified shops (4.5+ stars, 10+ reviews)

---

## Critical Gaps Identified

### 1. Missing Shop Owner Verification Page ❌

**Issue**: The URL `/dashboard/verification` returns a 404 error for shop owners.

**Current State**:
- ✅ Admin verification exists: `/dashboard/admin/verification/page.tsx`
- ❌ Shop owner verification: **MISSING**

**Impact**: Shop owners cannot view their verification status or upload documents.

### 2. Outdated Database Types ❌

**Issue**: `src/lib/database.types.ts` is missing fields from recent migrations:

**Missing Fields**:
- `users.has_shop` boolean field
- `rental_shops.status` enum field (`pending_verification` | `active` | `rejected`)
- `rental_shops.verification_documents` JSONB structure

**Current Types vs Actual Schema**:
```typescript
// database.types.ts (OUTDATED)
rental_shops: {
  Row: {
    // Missing 'status' field
    // Missing proper verification_documents structure
    is_verified: boolean
  }
}

// Actual Database Schema (CURRENT)
rental_shops: {
  status: 'pending_verification' | 'active' | 'rejected'
  verification_documents: {
    government_id: string
    business_permit: string
  }
  is_verified: boolean
}
```

### 3. Incomplete File Upload Flow ❌

**Current State**:
- ✅ Storage utilities exist (`src/lib/storage.ts`)
- ✅ Validation schemas exist (`src/lib/validation.ts`)  
- ✅ Admin can view uploaded documents
- ❌ Shop owners cannot upload documents - No UI component exists

**Missing Components**:
- Reusable `FileUpload` component
- Document upload UI for shop owners
- Document preview functionality
- File validation and error handling UI

### 4. Database Migration Sync Issues ❌

**Migration Files**:
- ✅ `20240501_shop_onboarding_v2.sql` - Adds `has_shop`, `status` enum
- ✅ `20240501_shop_onboarding_v2_fixed.sql` - Policy fixes
- ❌ Types not regenerated after migrations

---

## User Journey Flow

### Phase 1: Account Creation & Intent Selection

1. **Sign-Up Page** (`/sign-up`)
   - User selects "List My Vehicles" intent
   - System creates auth user with metadata:
     ```json
     {
       "role": "shop_owner",
       "intent": "shop_owner", 
       "has_shop": false,
       "first_name": "John",
       "last_name": "Doe"
     }
     ```

2. **Email Verification & Redirect**
   - Onboarding email sent via `/api/send-onboarding-email`
   - User redirected to `/dashboard` after verification

### Phase 2: Quick Start Registration

3. **Quick Start Onboarding Card**
   - Displays when `role === 'shop_owner'` AND `has_shop === false`
   - **Step 1**: Shop name, phone number
   - **Step 2**: Location area, description

4. **Immediate Access Process**
   - Makes POST request to `/api/shops`
   - Creates `rental_shops` record with `status: "pending_verification"` and `is_active: true`
   - Updates user's `has_shop: true` in database and auth metadata
   - User can immediately start listing vehicles

### Phase 3: Progressive Setup & Verification

5. **Progressive Setup Card** (after registration)
   - Tracks 6 setup tasks with point system
   - Achievement levels: Beginner → Expert
   - Shows next important tasks with benefits preview

6. **Verification System** (INCOMPLETE)
   - **Current**: Admin can verify shops via admin dashboard
   - **Missing**: Shop owners cannot upload documents or check verification status
   - **Gap**: No `/dashboard/verification` page for shop owners

---

## Technical Implementation

### Authentication Context

**Shop Owner Registration Flow**:
```typescript
const register = async (
  email: string,
  password: string, 
  firstName: string,
  lastName: string,
  role: string,
  intent?: string
) => {
  // Create Supabase auth user with metadata
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        role: intent === "shop_owner" ? "shop_owner" : role,
        intent: intent || role,
        has_shop: false,
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}
```

### Form Validation Schemas

```typescript
// Step 1 Schema
const step1Schema = z.object({
  shopName: z.string().min(2, "Shop name must be at least 2 characters"),
  phone: z.string().regex(/^(\+?63|0)?[0-9]{10}$/, "Please enter a valid Philippine phone number"),
});

// Step 2 Schema
const step2Schema = z.object({
  location_area: z.string().min(2, "Location area is required"),
  description: z.string().min(10, "Description must be at least 10 characters").max(200, "Keep it under 200 characters for now"),
});
```

### Conditional Rendering Logic

```typescript
// Dashboard display logic
const shouldShowQuickStart = user && 
  user.user_metadata?.role === 'shop_owner' && 
  user.user_metadata?.has_shop !== true;

const shouldShowProgressiveSetup = user &&
  user.user_metadata?.role === 'shop_owner' && 
  user.user_metadata?.has_shop === true &&
  !isDataLoading;
```

---

## Database Schema

### Core Tables

#### `users` Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL,
  has_shop BOOLEAN DEFAULT FALSE, -- Added in migration
  onboarding_email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `rental_shops` Table
```sql
CREATE TYPE shop_status AS ENUM ('pending_verification', 'active', 'rejected');

CREATE TABLE rental_shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT DEFAULT 'Siargao',
  location_area TEXT,
  phone_number TEXT,
  whatsapp TEXT,
  email TEXT,
  logo_url TEXT,
  banner_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  status shop_status DEFAULT 'pending_verification', -- Added in migration
  verification_documents JSONB, -- Added in migration
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Verification Documents Schema
```json
{
  "government_id": "", // Empty initially, uploaded via progressive setup
  "business_permit": ""  // Optional
}
```

### Row Level Security (RLS)

```sql
-- Shop owners can view their own shop
CREATE POLICY "Shop owners can view own shop" ON rental_shops
  FOR SELECT USING (auth.uid() = owner_id);

-- Shop owners can update their own shop
CREATE POLICY "Shop owners can update own shop" ON rental_shops  
  FOR UPDATE USING (auth.uid() = owner_id);

-- Admins can view all shops
CREATE POLICY "Admins can view all shops" ON rental_shops
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
```

---

## API Endpoints

### Shop Creation: POST `/api/shops`

**Request Body**:
```typescript
interface ShopRegistrationRequest {
  owner_id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  phone_number: string;
  email: string;
  location_area: string;
  status: 'pending_verification';
  verification_documents: {
    government_id: string;  // Empty initially
    business_permit: string; // Empty initially
  };
}
```

**Implementation Flow**:
1. Verify user exists in users table
2. Validate verification_documents with Zod schema
3. Insert shop record with `status='pending_verification'` 
4. Update `users.has_shop = true`
5. Update auth user metadata with `has_shop = true`
6. Send admin notification
7. Return created shop data

### Admin Verification: POST `/api/shops/verify`

**Purpose**: Admin approve/reject shop verification

**Request Body**:
```json
{
  "shopId": "shop-uuid",
  "approve": true
}
```

### Complete API Endpoints (15+ total)

**Core Shop Endpoints**:
- `POST /api/shops/` - Create new shop
- `GET /api/shops/browse/` - Browse/search shops
- `PATCH /api/shops/verify/` - Verify shops (admin)

**Shop Management**:
- `POST /api/shops/admin-set-active/` - Admin toggle active status
- `POST /api/shops/toggle-showcase/` - Admin toggle showcase
- `GET /api/shops/user/[userId]/` - Get shops by user

**Communication**:
- `POST /api/shops/send-verification-email/` - Send verification email
- `POST /api/send-onboarding-email/` - Send welcome email

---

## File Structure Reference

### Primary Onboarding Files

```
src/
├── app/
│   ├── sign-up/
│   │   └── page.tsx                    # User registration with intent selection
│   ├── dashboard/
│   │   ├── page.tsx                    # Main dashboard with onboarding components
│   │   ├── layout.tsx                  # Dashboard layout wrapper
│   │   └── admin/
│   │       └── verification/
│   │           └── page.tsx            # ✅ Admin verification dashboard
│   └── api/
│       ├── shops/
│       │   └── route.ts                # Shop creation endpoint
│       ├── send-onboarding-email/
│       │   └── route.ts                # Welcome email endpoint
│       └── auth/
│           └── register/
│               └── route.ts            # User record creation
├── components/
│   ├── shop/
│   │   ├── QuickStartOnboarding.tsx    # ✅ 2-step micro-onboarding
│   │   ├── ProgressiveSetupCard.tsx    # ✅ Gamified setup progress
│   │   ├── VerificationBadge.tsx       # ✅ Shop verification badges
│   │   └── ShopOnboardingBanner.tsx    # LEGACY: Deprecated
│   └── vehicles/
│       └── VehicleVerificationBadge.tsx # ✅ Vehicle verification badges
├── contexts/
│   └── AuthContext.tsx                 # ✅ Authentication state management
├── lib/
│   ├── featureFlags.ts                 # ✅ Feature flag configuration
│   ├── validation.ts                   # ✅ Zod schemas
│   ├── storage.ts                      # ✅ File upload utilities
│   ├── api.ts                          # ✅ API service layer
│   └── database.types.ts               # ❌ OUTDATED - Missing new fields
└── emails/
    └── ShopOwnerOnboardingEmail.tsx    # ✅ Welcome email template
```

### Database Migration Files

```
supabase/
└── migrations/
    ├── 20240501_shop_onboarding_v2.sql      # ✅ Adds has_shop, status enum
    └── 20240501_shop_onboarding_v2_fixed.sql # ✅ Policy fixes
```

---

## Missing Components

### 1. Shop Owner Verification Page ❌

**Required File**: `src/app/dashboard/verification/page.tsx`

**Missing Features**:
- View current verification status
- Upload government ID and business permit
- Track verification progress
- View admin feedback/comments
- Re-upload documents if rejected

### 2. File Upload Components ❌

**Required Components**:
- `src/components/ui/FileUpload.tsx` - Reusable file upload component
- `src/components/shop/DocumentUpload.tsx` - Document-specific upload UI
- `src/components/shop/DocumentPreview.tsx` - Preview uploaded documents

### 3. Updated Database Types ❌

**Required Update**: Regenerate `src/lib/database.types.ts` to include:
- `users.has_shop` boolean field
- `rental_shops.status` enum field
- `rental_shops.verification_documents` JSONB structure

**Command to Regenerate**:
```bash
supabase gen types typescript --linked > src/lib/database.types.ts
```

### 4. Verification Status Components ❌

**Missing UI Elements**:
- Verification progress indicators
- Status notification system
- Document requirement checklists
- Admin feedback display

---

## Implementation Recommendations

### Priority 1: Fix Critical Gaps

1. **Create Shop Owner Verification Page**
   ```typescript
   // src/app/dashboard/verification/page.tsx
   export default function VerificationPage() {
     // Display verification status
     // Show document upload interface
     // Track verification progress
   }
   ```

2. **Update Database Types**
   ```bash
   # Regenerate types from current database schema
   supabase gen types typescript --linked > src/lib/database.types.ts
   ```

3. **Build File Upload Components**
   ```typescript
   // src/components/ui/FileUpload.tsx
   interface FileUploadProps {
     onUpload: (file: File) => Promise<void>;
     acceptedTypes: string[];
     maxSize: number;
   }
   ```

### Priority 2: Enhanced UX

1. **Add Verification Progress Tracking**
2. **Implement Document Preview**
3. **Create Status Notification System**
4. **Add Re-upload Capability**

### Priority 3: Performance & Monitoring

1. **Add Verification Analytics**
2. **Implement Error Tracking**
3. **Add Performance Monitoring**
4. **Create Admin Verification Metrics**

---

## Current Status Summary

### ✅ Working Components
- Quick Start onboarding flow (2-step registration)
- Progressive setup system with gamification
- Admin verification dashboard
- Comprehensive API layer
- File storage infrastructure
- Authentication and role management
- Email notification system

### ❌ Critical Issues
- Missing shop owner verification page (`/dashboard/verification` → 404)
- Outdated database types missing recent schema changes
- No file upload UI for shop owners
- Incomplete verification status tracking

### 🔄 Required Actions
1. Create `/dashboard/verification` page for shop owners
2. Regenerate database types from current schema
3. Build file upload components for document submission
4. Implement verification status tracking UI

The onboarding system is **90% complete** but has critical gaps that prevent shop owners from completing the verification process independently. The foundation is solid and well-architected - it just needs the missing verification UI components to be fully functional.

---

**For technical support or questions about this system, refer to the implementation files listed above or contact the development team.**