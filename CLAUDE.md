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

## Claude Code Memories

- When gather context on the backend, always use the Supabase MCP server when necessary or whenever you need to do anything with the backend database.
- Use the Context7 MCP server for up to date documentation for dependencies, etc.