# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks
- `npm run reset-db` - Reset database using scripts/reset-db.js
- `npm run setup-storage` - Setup Supabase storage buckets

## Tech Stack & Architecture

**Frontend:**
- Next.js 15+ with App Router
- React 18+ with TypeScript in strict mode
- TailwindCSS for styling with dark/minimalist theme
- shadcn/ui and Radix UI primitives for components
- Framer Motion for animations
- React Hook Form + Zod for form validation

**Backend:**
- Supabase (PostgreSQL, Auth, Storage, RLS)
- API routes in `src/app/api/`
- Service layer at `src/lib/service.ts`
- Direct Supabase calls in `src/lib/api.ts`

**Key Libraries:**
- `@supabase/supabase-js` and `@supabase/auth-helpers-nextjs`
- `@tanstack/react-query` for data fetching
- `date-fns` for date operations (standardized)
- `resend` for email notifications
- `react-google-recaptcha-v3` for form protection

## Code Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/               # Backend API endpoints
│   ├── dashboard/         # Role-based dashboard pages
│   ├── booking/          # Booking flow pages
│   └── ...               # Other pages
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   ├── dashboard/        # Dashboard-specific components
│   └── ...               # Feature-specific components
├── lib/                  # Core utilities and services
│   ├── types.ts          # TypeScript type definitions
│   ├── service.ts        # Business logic layer
│   ├── api.ts            # Supabase API calls
│   └── supabase.ts       # Supabase client setup
└── contexts/             # React contexts (Auth, etc.)
```

## Database Architecture

**Core Tables:**
- `users` - Authentication and profiles
- `rental_shops` - Shop information and verification
- `vehicles` - Vehicle inventory (replaces legacy `bikes`)
- `rentals` - Booking records
- `reviews` - User reviews and ratings
- `referrals` - Referral tracking system

**Key Features:**
- Row Level Security (RLS) on all tables
- Multi-role authentication (tourist, shop_owner, admin)
- Vehicle categories and types
- Payment integration with PayMongo
- Subscription system for shop owners

## Development Guidelines

**Code Standards:**
- All code must be TypeScript in strict mode
- Use functional components with hooks
- Follow naming: PascalCase for components, camelCase for functions
- Keep files under 250 LOC
- Use Zod schemas for all data validation

**Database Changes:**
- Generate raw SQL for manual execution in Supabase SQL Editor
- Update type definitions in `src/lib/types.ts`
- Never assume database structure - use Supabase MCP to query live data

**UI/UX:**
- Mobile-first responsive design
- Dark theme with teal/coral accents
- Use Lucide React for icons consistently
- Implement proper accessibility (ARIA, semantic HTML)

**Testing & Quality:**
- Run `npm run lint` before commits
- Ensure `npm run build` passes
- Use TypeScript strict mode (no `any` types)
- Validate all external input with Zod

## Business Logic

**Core Features:**
- Vehicle rental marketplace connecting shops and tourists
- Multi-vehicle support (motorcycles, cars, tuktuks)
- Booking system with date selection and payments
- Review and rating system
- Admin dashboard for user/shop management
- Referral system for shop acquisition

**Payment Methods:**
- Cash payments with deposit system
- GCash integration
- PayMongo for card payments

**Role-Based Access:**
- Tourists: Browse, book, review
- Shop Owners: Manage inventory, view bookings
- Admins: Full system management

## Important Files

- `src/lib/types.ts` - All TypeScript definitions
- `supabase/` - Database migrations and functions
- `docs/` - Feature implementation guides
- `.cursor/rules/ai-agent-rules.mdc` - AI coding standards
- `docs/AI-agent-rules.md` - Additional project guidelines

## Security Notes

- All API routes use Supabase RLS for authorization
- Environment variables managed via `.env` files
- Never commit secrets or API keys
- Validate all user input with Zod schemas
- Use HTTPS and secure headers in production

## Environment Setup

**Required Environment Variables (.env.local):**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_KEY` - Service role key for admin operations
- `NEXT_PUBLIC_SITE_URL` - Site URL for auth redirects
- `NEXT_PUBLIC_USE_MOCK_DATA` - Feature flag (true/false)
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` / `RECAPTCHA_SECRET_KEY` - reCAPTCHA keys
- `RESEND_API_KEY` - Email service API key
- `PAYMONGO_SECRET_KEY` / `NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY` - Payment keys
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` - PayPal payment keys
- `PAYPAL_WEBHOOK_ID` / `PAYPAL_ENVIRONMENT` - PayPal webhook and environment config

**Feature Flags:**
- Environment-based toggles using `NEXT_PUBLIC_FEATURE_*` pattern
- Currently includes `NEXT_PUBLIC_FEATURE_ONBOARDING_V2`

## Key Configuration

**Authentication & Security:**
- Supabase Auth with `@supabase/auth-helpers-nextjs`
- Middleware handles auth sessions and JWT cleanup
- Service role key separated for admin operations
- reCAPTCHA protection on forms

**Build Configuration:**
- TypeScript strict mode with `noImplicitAny: false`
- ESLint ignores build errors for faster development
- Vercel cron jobs for auto-cancellation processing
- Image optimization for Supabase storage domains

**Feature Architecture:**
- Multi-role system (tourist, shop_owner, admin)
- Payment integration (PayMongo, GCash, cash deposits)
- Email notifications via Resend
- File uploads with browser compression
- Referral tracking system

## Data Flow Patterns

**Authentication Flow:**
- Supabase Auth → middleware → RLS policies
- Role-based redirects via auth callbacks
- Session persistence across page reloads

**Booking System:**
- Date availability checking → price calculation → payment processing
- Auto-cancellation for unpaid bookings
- Email notifications at each step

**Shop Management:**
- Progressive onboarding with verification steps
- Subscription-based access control
- Vehicle inventory management with categories

## AI Development Notes

**MCP Server Usage:**
- Always use Supabase MCP for database context and queries
- Use Context7 MCP for up-to-date dependency documentation
- Never assume database structure - query live data

**Code Standards from .cursor/rules:**
- Functional, modular design with files <250 LOC
- TypeScript strict mode, no `any` types
- Zod validation for all external input
- Conventional Commits format
- Jest/Testing-Library tests for all exports

**Project-Specific Requirements:**
- 🤖 Start responses with emoji to confirm rule compliance
- Break large tasks into smaller chunks
- Ask clarification before complex implementations
- Use date-fns consistently (avoid moment, multiple calendar libraries)
- Generate raw SQL for schema changes (no CLI commands)
- Prioritize mobile-first responsive design