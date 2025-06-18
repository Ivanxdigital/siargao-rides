# Siargao Rides Booking System - Technical Architecture Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Database Architecture](#database-architecture)
3. [Booking Flow](#booking-flow)
4. [Key Files & Components](#key-files--components)
5. [API Architecture](#api-architecture)
6. [Payment System](#payment-system)
7. [Email Notifications](#email-notifications)
8. [State Management](#state-management)
9. [Security & Authentication](#security--authentication)
10. [Testing & Deployment](#testing--deployment)

---

## System Overview

Siargao Rides is a vehicle rental marketplace built on modern web technologies, connecting tourists with local rental shops in Siargao, Philippines.

### Technology Stack
- **Frontend**: Next.js 15 with App Router, React 18, TypeScript (strict mode)
- **Backend**: Supabase (PostgreSQL, Auth, Storage, RLS)
- **Styling**: TailwindCSS with shadcn/ui components
- **Payment**: PayMongo integration (cards, GCash, deposits)
- **Email**: Resend service with React Email templates
- **Form Validation**: Zod schemas
- **Date Handling**: date-fns (standardized across codebase)

### Core Features
- Multi-vehicle support (motorcycles, cars, tuktuks, vans)
- Real-time availability checking
- Multiple payment methods (cash, deposits, online payments)
- Email notification system
- Admin dashboard for shop management
- Review and rating system
- Auto-cancellation for no-shows

---

## Database Architecture

### Core Tables

#### `rentals` Table (Primary Booking Entity)
The central table that stores all booking information. Supports both legacy `bikes` and new `vehicles` through foreign keys.

```sql
CREATE TABLE rentals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Vehicle references (supports both legacy and new system)
  vehicle_id UUID REFERENCES vehicles(id),
  bike_id UUID REFERENCES bikes(id), -- Legacy support
  vehicle_type_id UUID REFERENCES vehicle_types(id),
  
  -- Core booking info
  user_id UUID REFERENCES users(id),
  shop_id UUID REFERENCES rental_shops(id),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  total_price NUMERIC NOT NULL,
  
  -- Status tracking
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  
  -- Payment & delivery
  payment_method_id UUID REFERENCES payment_methods(id),
  delivery_option_id UUID REFERENCES delivery_options(id),
  delivery_address TEXT,
  
  -- Deposit system
  deposit_required BOOLEAN DEFAULT false,
  deposit_amount NUMERIC DEFAULT 0,
  deposit_paid BOOLEAN DEFAULT false,
  deposit_payment_id TEXT,
  
  -- Auto-cancellation for cash payments
  pickup_time TIMESTAMPTZ,
  grace_period_minutes INTEGER DEFAULT 30,
  auto_cancel_enabled BOOLEAN DEFAULT false,
  auto_cancel_processed BOOLEAN DEFAULT false,
  shop_owner_override BOOLEAN DEFAULT false,
  
  -- Additional fields
  confirmation_code TEXT,
  contact_info JSONB,
  customer_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `vehicles` Table (New Multi-Vehicle System)
```sql
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES rental_shops(id),
  vehicle_type_id UUID REFERENCES vehicle_types(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- scooter, sedan, tuktuk, etc.
  
  -- Pricing
  price_per_day NUMERIC NOT NULL,
  price_per_week NUMERIC,
  price_per_month NUMERIC,
  
  -- Availability
  is_available BOOLEAN DEFAULT true,
  
  -- Vehicle-specific fields
  color TEXT,
  year INTEGER,
  license_plate TEXT,
  seats INTEGER, -- for cars
  transmission TEXT, -- manual/automatic
  fuel_type TEXT, -- gasoline/diesel/electric
  specifications JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `bikes` Table (Legacy Support)
Maintained for backward compatibility with existing data.
```sql
CREATE TABLE bikes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES rental_shops(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- scooter, semi_auto, dirt_bike, sport_bike
  price_per_day NUMERIC NOT NULL,
  price_per_week NUMERIC,
  price_per_month NUMERIC,
  is_available BOOLEAN DEFAULT true,
  specifications JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Supporting Tables

#### `payment_methods` Table
```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- "Cash Payment", "PayMongo Card", etc.
  description TEXT,
  provider TEXT, -- "paymongo", null for cash
  is_online BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  requires_deposit BOOLEAN DEFAULT false
);
```

#### `delivery_options` Table
```sql
CREATE TABLE delivery_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- "Self Pickup", "Delivery to Accommodation"
  description TEXT,
  fee NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  requires_address BOOLEAN DEFAULT false
);
```

#### `paymongo_payments` Table
```sql
CREATE TABLE paymongo_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rental_id UUID REFERENCES rentals(id),
  payment_intent_id TEXT NOT NULL,
  client_key TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'PHP',
  status TEXT, -- PayMongo payment status
  is_deposit BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `booking_history` Table
```sql
CREATE TABLE booking_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES rentals(id),
  event_type TEXT, -- 'creation', 'status_change', 'payment', 'review'
  status TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Key Database Functions

#### `check_vehicle_availability` Function
```sql
CREATE OR REPLACE FUNCTION check_vehicle_availability(
  vehicle_id UUID,
  start_date DATE,
  end_date DATE
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check for overlapping bookings in both vehicles and bikes tables
  RETURN NOT EXISTS (
    SELECT 1 FROM rentals 
    WHERE (rentals.vehicle_id = vehicle_id OR rentals.bike_id = vehicle_id)
    AND status IN ('pending', 'confirmed')
    AND (
      (start_date <= rentals.end_date::date AND end_date >= rentals.start_date::date)
    )
  );
END;
$$ LANGUAGE plpgsql;
```

---

## Booking Flow

### 1. Vehicle Discovery Phase

**Entry Points:**
- `/browse` - Main vehicle browsing page
- `/shop/[id]` - Individual shop pages
- Search functionality with filters

**Key Components:**
- `src/app/browse/page.tsx` - Main browse page
- `src/components/VehicleCard.tsx` - Vehicle display component
- `src/components/SearchBar.tsx` - Search and filtering

**Flow:**
1. User browses available vehicles
2. Optional: Filter by dates, vehicle type, location
3. Click "Book Now" button on vehicle card
4. Redirected to booking page with vehicle ID and optional date parameters

### 2. Booking Form Phase

**Primary File:** `src/app/booking/[vehicleId]/page.tsx`

**Data Loading Process:**
```typescript
// 1. Extract vehicle ID and optional dates from URL
const { vehicleId } = useParams();
const startDate = searchParams.get("startDate");
const endDate = searchParams.get("endDate");

// 2. Fetch vehicle data (supports both vehicles and bikes tables)
// First try vehicles table, fallback to bikes for backward compatibility
try {
  const { data: vehicleData } = await supabase
    .from('vehicles')
    .select(`*, vehicle_images(*), vehicle_types(*)`)
    .eq('id', vehicleId)
    .single();
} catch {
  // Fallback to bikes table
  const { data: bikeData } = await supabase
    .from('bikes')
    .select(`*, bike_images(*)`)
    .eq('id', vehicleId)
    .single();
}

// 3. Fetch related data
const shop = await fetchShopData(shopId);
const deliveryOptions = await fetchDeliveryOptions();
const paymentSettings = await fetchPaymentSettings();
```

**Component Structure:**
```
/booking/[vehicleId]/page.tsx
├── BookingForm.tsx (Left column)
│   ├── DateRangePicker.tsx
│   ├── TimeSlotPicker.tsx (for cash payments)
│   ├── ContactInfoInput.tsx
│   └── TermsAndConditions.tsx
└── BookingSummary.tsx (Right column)
    └── VehicleDetailsDisplay.tsx
```

### 3. Form Validation & Submission

**Validation Process:**
```typescript
// Client-side validation
if (!startDate || !endDate) {
  setFormError("Please select both start and end dates.");
  return;
}

// Real-time availability check before submission
const response = await fetch(`/api/vehicles/check-availability`, {
  method: 'POST',
  body: JSON.stringify({
    vehicleId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  })
});

const { available, overlappingBookings } = await response.json();
if (!available) {
  // Show alternative dates if vehicle is not available
  const alternatives = await findAlternativeDates(vehicleId, startDate, endDate);
  setFormError(`Vehicle not available. Alternative dates: ${alternatives}`);
  return;
}
```

**Booking Creation:**
```typescript
// BookingForm.tsx - handleSubmit function
const bookingData = {
  shop_id: shop.id,
  user_id: session?.user?.id,
  start_date: startDate.toISOString(),
  end_date: endDate.toISOString(),
  total_price: calculatedTotal,
  delivery_option_id: deliveryOption,
  payment_method_id: paymentMethod,
  status: "pending",
  payment_status: "pending",
  confirmation_code: generateConfirmationCode(),
  // Vehicle reference (supports both new and legacy)
  ...(vehicle ? { vehicle_id: vehicle.id, vehicle_type_id: vehicle.vehicle_type_id } 
               : { bike_id: bike.id })
};

const { data: booking } = await supabase
  .from("rentals")
  .insert(bookingData)
  .select()
  .single();
```

### 4. Payment Processing

**Payment Method Routing:**
```typescript
// Different flows based on payment method
if (paymentMethod === 'paymongo_card' || paymentMethod === 'paymongo_gcash') {
  // Online payment flow
  router.push(`/booking/payment/${booking.id}?payment_type=${paymentType}`);
} else if (paymentMethod === 'cash') {
  // Cash with deposit flow
  router.push(`/booking/deposit-payment/${booking.id}`);
} else if (paymentMethod === 'temp_cash') {
  // Cash without deposit (temporary)
  router.push(`/booking/confirmation/${booking.id}?payment_method=temp_cash`);
}
```

### 5. Email Notifications

**Automatic Email Triggers:**
```typescript
// Send emails after successful booking creation
const emailResponse = await fetch('/api/send-booking-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    booking: createdBooking,
    user: sessionUser,
    shop: shopData
  })
});
```

### 6. Confirmation & Management

**Confirmation Page:** `src/app/booking/confirmation/[id]/page.tsx`

**Features:**
- Booking timeline display
- Payment status tracking
- Vehicle and shop details
- Customer information
- Print/share functionality
- Review submission (for completed bookings)

---

## Key Files & Components

### Pages

#### `/booking/[vehicleId]/page.tsx`
**Purpose:** Main booking page
**Key Features:**
- Dual compatibility (vehicles + bikes tables)
- URL parameter handling for pre-filled dates
- Showcase shop detection and blocking
- Error handling and loading states

#### `/booking/confirmation/[id]/page.tsx`
**Purpose:** Booking confirmation and management
**Key Features:**
- Complete booking timeline
- Payment status display
- Review submission system
- Print-friendly design

#### `/booking/payment/[id]/page.tsx`
**Purpose:** PayMongo payment processing
**Key Features:**
- PayMongo Elements integration
- Card and GCash payment support
- Real-time payment status updates

#### `/booking/deposit-payment/[id]/page.tsx`
**Purpose:** Deposit payment for cash bookings
**Key Features:**
- Secure deposit processing
- Anti-ghost booking mechanism
- PayMongo deposit payment integration

### Core Components

#### `BookingForm.tsx`
**Location:** `src/components/BookingForm.tsx`
**Purpose:** Main booking form with all input fields
**Key Features:**
- Payment method selection with dynamic options
- Delivery option handling
- Contact information collection
- Terms and conditions agreement
- Real-time availability checking
- Alternative date suggestions

#### `BookingSummary.tsx`
**Location:** `src/components/BookingSummary.tsx`
**Purpose:** Right-side booking summary with price calculation
**Key Features:**
- Dynamic pricing (daily/weekly/monthly rates)
- Delivery fee calculation
- Vehicle details display
- Deposit requirements display

#### `DateRangePicker.tsx`
**Location:** `src/components/DateRangePicker.tsx`
**Purpose:** Date selection with availability checking
**Key Features:**
- Blocked date visualization
- Real-time availability checking
- Calendar integration with react-day-picker

### API Routes

#### `/api/vehicles/check-availability/route.ts`
**Purpose:** Real-time vehicle availability checking
**Features:**
- Dual table support (vehicles + bikes)
- Robust error handling
- Database function integration
- Direct query fallback

#### `/api/create-booking/route.ts`
**Purpose:** Main booking creation endpoint
**Features:**
- Guest and authenticated user support
- Price validation
- Availability double-checking
- Booking record creation

#### `/api/payments/create-intent/route.ts`
**Purpose:** PayMongo payment intent creation
**Features:**
- Secure payment processing
- Metadata tracking
- Database integration

#### `/api/send-booking-email/route.ts`
**Purpose:** Email notification system
**Features:**
- Dual email sending (customer + shop)
- React Email templates
- Error handling and fallbacks
- Development mode support

### Type Definitions

#### `src/lib/types.ts`
**Purpose:** Complete TypeScript type definitions
**Key Types:**
- `Vehicle` - New multi-vehicle system
- `Bike` - Legacy motorcycle system
- `Rental` - Booking records
- `RentalShop` - Shop information
- `VehicleType` - Vehicle categorization

#### `src/lib/database.types.ts`
**Purpose:** Supabase-generated database types
**Usage:** Direct mapping to database schema

---

## API Architecture

### Availability Checking System

The availability system is designed to be robust and handle high concurrency:

```typescript
// Primary availability check flow
export async function POST(request: NextRequest) {
  const { vehicleId, startDate, endDate } = await request.json();
  
  // 1. Validate input
  const parsedStartDate = new Date(startDate);
  const parsedEndDate = new Date(endDate);
  
  // 2. Check vehicle exists (dual table support)
  let vehicle = await checkVehiclesTable(vehicleId);
  if (!vehicle) {
    vehicle = await checkBikesTable(vehicleId); // Fallback
  }
  
  // 3. Direct booking conflict check
  const conflicts = await checkDirectBookingConflicts(vehicleId, parsedStartDate, parsedEndDate);
  
  // 4. Database function verification
  const isAvailable = await supabase.rpc('check_vehicle_availability', {
    vehicle_id: vehicleId,
    start_date: parsedStartDate.toISOString().split('T')[0],
    end_date: parsedEndDate.toISOString().split('T')[0]
  });
  
  return NextResponse.json({ available: isAvailable });
}
```

### Payment Processing Architecture

**PayMongo Integration:**
```typescript
// Payment intent creation
const paymentIntent = await createPaymentIntent(
  convertAmountToCents(amount),
  `Payment for Rental #${rentalId}`,
  { rental_id: rentalId, user_id: userId }
);

// Store in database
await supabaseAdmin
  .from('paymongo_payments')
  .insert({
    rental_id: rentalId,
    payment_intent_id: paymentIntent.id,
    client_key: paymentIntent.attributes.client_key,
    amount: amount,
    currency: 'PHP',
    status: paymentIntent.attributes.status
  });
```

**Deposit System:**
```typescript
// Deposit payment for cash bookings
if (paymentMethod === 'cash') {
  bookingData.deposit_required = true;
  bookingData.deposit_amount = DEPOSIT_AMOUNT; // 300 PHP
  bookingData.deposit_paid = false;
  // Redirect to deposit payment page
  router.push(`/booking/deposit-payment/${booking.id}`);
}
```

---

## Payment System

### Payment Methods

1. **Temporary Cash Payment (No Deposit)**
   - Full payment at pickup/delivery
   - Pickup time required
   - Auto-cancellation after grace period
   - No upfront payment required

2. **Cash Payment with Deposit**
   - ₱300 deposit via PayMongo
   - Remaining amount paid in cash
   - Anti-ghost booking mechanism
   - Deposit forfeited if no-show

3. **PayMongo Card Payment**
   - Full payment via credit/debit card
   - Immediate confirmation
   - Secure payment processing

4. **PayMongo GCash Payment**
   - Full payment via GCash e-wallet
   - Popular in Philippines
   - Mobile-friendly flow

### Payment Flow Architecture

```typescript
// Payment method configuration (system settings)
const systemSettings = {
  enable_temporary_cash_payment: true,
  enable_cash_with_deposit: true,
  enable_paymongo_card: true,
  enable_paymongo_gcash: true,
  default_grace_period_minutes: 30,
  deposit_amount: 300 // PHP
};

// Dynamic payment options based on settings
const paymentOptions = [
  ...(systemSettings.enable_temporary_cash_payment ? [temporaryCashOption] : []),
  ...(systemSettings.enable_cash_with_deposit ? [cashWithDepositOption] : []),
  ...(systemSettings.enable_paymongo_card ? [cardOption] : []),
  ...(systemSettings.enable_paymongo_gcash ? [gcashOption] : [])
];
```

---

## Email Notifications

### Email System Architecture

**Service:** Resend with React Email templates
**Domain:** `siargaorides.ph` (verified domain)

### Email Templates

#### Customer Confirmation Email
**File:** `src/emails/BookingConfirmationEmail.tsx`
**Triggers:** Immediate after booking creation
**Content:**
- Booking details and confirmation code
- Vehicle information and images
- Shop contact details
- Payment instructions
- Timeline and next steps

#### Shop Notification Email
**File:** `src/emails/ShopNotificationEmail.tsx`
**Triggers:** Immediate after booking creation
**Content:**
- New booking alert
- Customer details
- Vehicle and booking information
- Payment method and status
- Action required notice

### Email Sending Flow

```typescript
// Email API route: /api/send-booking-email/route.ts
export async function POST(request: Request) {
  const { booking, user, shop } = await request.json();
  
  // Send customer confirmation
  const customerEmailResult = await resend.emails.send({
    from: 'Siargao Rides <support@siargaorides.ph>',
    to: user.email,
    subject: `Booking Confirmation #${booking.confirmation_code}`,
    react: BookingConfirmationEmail({ booking, user, shop })
  });
  
  // Send shop notification
  const shopEmailResult = await resend.emails.send({
    from: 'Siargao Rides <support@siargaorides.ph>',
    to: shop.email,
    subject: `New Booking Request #${booking.confirmation_code}`,
    react: ShopNotificationEmail({ booking, user, shop })
  });
  
  return NextResponse.json({
    status: 'success',
    customerEmailId: customerEmailResult.id,
    shopEmailId: shopEmailResult.id
  });
}
```

---

## State Management

### Client-Side State Flow

**Booking Form State:**
```typescript
// BookingForm.tsx state management
const [startDate, setStartDate] = useState<Date | null>(null);
const [endDate, setEndDate] = useState<Date | null>(null);
const [deliveryOption, setDeliveryOption] = useState<string | null>(null);
const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
const [deliveryFee, setDeliveryFee] = useState(0);
const [formError, setFormError] = useState<string | null>(null);

// Real-time price calculation
useEffect(() => {
  if (startDate && endDate && vehicle) {
    const days = differenceInDays(endDate, startDate);
    const rentalPrice = calculateDynamicPricing(vehicle, days);
    const total = rentalPrice + deliveryFee;
    updatePricingSummary(total);
  }
}, [startDate, endDate, deliveryFee, vehicle]);

// Availability checking
useEffect(() => {
  if (startDate && endDate && vehicle?.id) {
    checkVehicleAvailability(vehicle.id, startDate, endDate);
  }
}, [startDate, endDate, vehicle?.id]);
```

### Database State Transitions

**Booking Status Flow:**
```
pending → confirmed → completed
    ↓
cancelled (at any point)
```

**Payment Status Flow:**
```
pending → paid → refunded
    ↓
cancelled
```

**Auto-Cancellation Flow:**
```typescript
// For temporary cash payments
if (paymentMethod === 'temp_cash' && pickupTime) {
  const cancelTime = new Date(pickupTime);
  cancelTime.setMinutes(cancelTime.getMinutes() + gracePeriodMinutes);
  
  bookingData.auto_cancel_enabled = true;
  bookingData.auto_cancel_scheduled_for = cancelTime.toISOString();
}
```

---

## Security & Authentication

### Row Level Security (RLS)

**Rentals Table Policy:**
```sql
-- Users can only view their own bookings
CREATE POLICY "Users can view own rentals" ON rentals
  FOR SELECT USING (auth.uid() = user_id);

-- Shop owners can view bookings for their shops
CREATE POLICY "Shop owners can view shop rentals" ON rentals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rental_shops 
      WHERE rental_shops.id = rentals.shop_id 
      AND rental_shops.owner_id = auth.uid()
    )
  );
```

**Payment Security:**
```sql
-- Only authenticated users can create payments
CREATE POLICY "Authenticated users can create payments" ON paymongo_payments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can only view their own payments
CREATE POLICY "Users can view own payments" ON paymongo_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rentals 
      WHERE rentals.id = paymongo_payments.rental_id 
      AND rentals.user_id = auth.uid()
    )
  );
```

### Authentication Flow

**User Session Management:**
```typescript
// Auth context and session handling
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
    });
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session?.user);
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);
  
  return { user, isAuthenticated };
}
```

### API Route Security

**Middleware Authentication:**
```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });
  
  // Refresh session if expired
  await supabase.auth.getSession();
  
  return res;
}
```

**Protected API Routes:**
```typescript
// API route authentication pattern
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Process authenticated request
}
```

---

## Testing & Deployment

### Environment Configuration

**Required Environment Variables:**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# PayMongo
PAYMONGO_SECRET_KEY=your_paymongo_secret
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=your_paymongo_public

# Email
RESEND_API_KEY=your_resend_key

# Feature Flags
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_FEATURE_ONBOARDING_V2=true
```

### Development Workflow

**Local Development:**
```bash
npm run dev         # Start development server
npm run build       # Test production build
npm run lint        # Run ESLint checks
npm run reset-db    # Reset database (if needed)
```

**Database Operations:**
- Use Supabase SQL Editor for schema changes
- Generate TypeScript types: `supabase gen types typescript`
- Test availability function: `SELECT check_vehicle_availability('uuid', 'date', 'date')`

### Production Deployment

**Vercel Configuration:**
- Automatic deployments from main branch
- Environment variables set in Vercel dashboard
- Cron jobs for auto-cancellation processing
- Edge functions for real-time features

**Database Monitoring:**
- Monitor booking creation rates
- Track payment success rates
- Watch for availability conflicts
- Monitor email delivery status

---

## Troubleshooting Guide

### Common Issues

1. **Vehicle Not Found Errors**
   - Check both `vehicles` and `bikes` tables
   - Verify vehicle ID format (UUID)
   - Ensure vehicle belongs to correct shop

2. **Availability Check Failures**
   - Verify database function exists: `check_vehicle_availability`
   - Check for overlapping date ranges
   - Validate date format (ISO strings)

3. **Payment Integration Issues**
   - Verify PayMongo API keys
   - Check webhook configurations
   - Monitor payment intent status

4. **Email Delivery Problems**
   - Verify Resend domain verification
   - Check DNS records for custom domain
   - Monitor email sending logs

### Debug Tools

**Database Queries:**
```sql
-- Check booking conflicts
SELECT * FROM rentals 
WHERE (vehicle_id = 'uuid' OR bike_id = 'uuid')
AND status IN ('pending', 'confirmed')
AND start_date <= 'end_date' AND end_date >= 'start_date';

-- Check payment status
SELECT r.*, pm.* FROM rentals r
LEFT JOIN paymongo_payments pm ON r.id = pm.rental_id
WHERE r.id = 'booking_uuid';
```

**API Testing:**
```bash
# Test availability
curl -X POST /api/vehicles/check-availability \
  -H "Content-Type: application/json" \
  -d '{"vehicleId":"uuid","startDate":"2024-01-01","endDate":"2024-01-02"}'

# Test booking creation
curl -X POST /api/create-booking \
  -H "Content-Type: application/json" \
  -d '{"vehicleId":"uuid","startDate":"2024-01-01","endDate":"2024-01-02",...}'
```

---

## Performance Considerations

### Database Optimization

**Indexes:**
```sql
-- Essential indexes for booking queries
CREATE INDEX idx_rentals_vehicle_id ON rentals(vehicle_id);
CREATE INDEX idx_rentals_bike_id ON rentals(bike_id);
CREATE INDEX idx_rentals_dates ON rentals(start_date, end_date);
CREATE INDEX idx_rentals_status ON rentals(status);
```

**Query Optimization:**
- Use `check_vehicle_availability` function for complex availability queries
- Implement database connection pooling
- Monitor slow queries and add appropriate indexes

### Frontend Performance

**Code Splitting:**
```typescript
// Lazy load payment components
const PaymentForm = lazy(() => import('./PaymentForm'));
const DepositForm = lazy(() => import('./DepositForm'));
```

**Caching Strategy:**
- Cache vehicle data with SWR/React Query
- Implement service worker for offline functionality
- Use Next.js Image optimization for vehicle photos

---

This documentation provides a complete technical overview of the Siargao Rides booking system. Any senior developer should be able to understand the architecture, maintain existing functionality, and extend the system with new features after reading this guide.

For questions or clarifications, refer to the individual file comments and the existing implementation in the codebase.