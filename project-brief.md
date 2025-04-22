# Project: Siargao Rides – AI Agent Codebase Guide

## Vision
A modern web platform connecting **local vehicle rental shops** in Siargao with **tourists** seeking to compare, reserve, and rent motorcycles, cars, and tuktuks. Shop owners manage listings, inventory, and bookings; tourists browse, book, and review—all with a focus on seamless UI/UX and rapid feature iteration.

---

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Styling:** TailwindCSS (dark, minimalist theme)
- **UI Components:** shadcn/ui, custom components
- **Animation:** Framer Motion
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Validation:** Zod
- **State:** React Context, hooks, React Query
- **Testing:** Vitest, MSW (unit, integration, >90% coverage goal)
- **Other:** Radix UI, date-fns, react-hot-toast/sonner

---

## Codebase Structure

```
siargao-rides/
├── public/              # Static assets (images, favicon, etc.)
├── src/
│   ├── app/             # Next.js App Router pages & API routes
│   │   ├── [locale]/    # i18n support (if enabled)
│   │   ├── about/       # About page
│   │   ├── api/         # API endpoints (REST, server actions)
│   │   ├── bikes/, vehicles/, bookings/, shop/, dashboard/, etc.
│   │   ├── components/  # Page-level and shared components
│   │   ├── layout.tsx   # Root layout (Navbar, Footer, Providers)
│   │   └── ...          # All user-facing and admin pages
│   ├── components/      # Reusable UI, dashboard, shop, layout, etc.
│   ├── contexts/        # React Contexts (Auth, Theme, etc.)
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # API/service layer, types, utils, scripts
│   ├── messages/        # i18n translations
│   ├── types/           # TypeScript type declarations
│   └── utils/           # Utility functions
├── supabase/            # DB migrations, edge functions, config
├── scripts/             # Node scripts (DB reset, storage setup)
├── docs/                # Developer docs, feature guides, changelog
├── static/              # Next.js build output (ignore)
├── package.json         # Dependencies, scripts
├── tailwind.config.js   # TailwindCSS config
├── next.config.ts       # Next.js config
└── ...
```

---

## Architecture Overview

### Frontend
- **Next.js App Router:** File-based routing, layouts, server components
- **shadcn/ui:** Modern, accessible UI primitives (see `src/components/ui/`)
- **TailwindCSS:** Utility-first, dark/minimalist theme
- **Framer Motion:** Micro-animations for smooth UX
- **React Context & Query:** Auth, global state, async data

### Backend
- **Supabase:**
  - **PostgreSQL:** Main DB (see `supabase-schema.sql`, `migrations/` or use the Supabase Database MCP server FIRST)
  - **Auth:** Email/password, Google, roles (tourist, shop_owner, admin)
  - **Storage:** Images for vehicles, shops, users
  - **RLS:** Row-level security for all tables
- **API Routes:**
  - Located in `src/app/api/`
  - RESTful endpoints for CRUD, business logic, admin actions
  - Use Supabase client (service role for admin ops)

### Data Flow
- **Service Layer:** `src/lib/service.ts` (business logic, mock/real data)
- **API Layer:** `src/lib/api.ts` (direct Supabase calls)
- **Types:** `src/lib/types.ts`, `src/types/`

---

## Key Features & Modules

- **Browse & Search:** `/browse`, filters by type, price, location, availability
- **Shop Profiles:** `/shop/[id]`, details, reviews, vehicles
- **Booking System:** `/booking/[vehicleId]`, date selection, payment, confirmation
- **Dashboard:** `/dashboard`, role-based (tourist, shop_owner, admin)
- **Admin Tools:** `/dashboard/admin`, user/shop/vehicle management, settings
- **Payments:** Cash, GCash, PayMongo (see `docs/cash-deposit-implementation-guide.md`)
- **Reviews & Ratings:** Linked to rentals, visible on shop/vehicle pages
- **Referrals:** User referral system (see `supabase/migrations/2024-06-09T-referral-system.sql`)
- **Subscription System:** Shop trial/activation, auto-expiry (see `docs/subscription-system.md`)
- **Notifications:** Email (Resend), in-app, booking status
- **Testing:** Vitest, MSW, `__tests__/` (see custom scripts)

---

## Database & Supabase

- **Main Tables:**
  - `users`: Auth, profile, role
  - `rental_shops`: Shop info, owner, verification, subscription
  - `vehicles`/`bikes`: Inventory, specs, images
  - `rentals`: Bookings, status, payment, deposit
  - `reviews`: Linked to rentals, users, shops
  - `favorites`: User favorites
  - `referrals`: Referral tracking
  - `system_settings`: Global config (e.g., payment toggles)
- **Migrations:** `supabase/migrations/`, `supabase-schema.sql`
- **RLS Policies:** All tables protected; see SQL for details
- **Adding Tables:** Write SQL migration, update types in `src/lib/types.ts`/`src/types/`

But **always** use the MCP Supabase database to query our database first as this could potentially be outdated. So always check.

---

## Adding New Features

1. **Page:** Add to `src/app/`, use functional components, Tailwind, shadcn/ui
2. **API Route:** Add to `src/app/api/`, use Supabase client, validate input (Zod)
3. **Component:** Place in `src/components/`, follow shadcn/ui patterns
4. **DB Table:** Write migration in `supabase/migrations/`, update types
5. **Test:** Place under `__tests__/`, use Vitest/MSW, target >90% coverage
6. **Docs:** Add/modify JSDoc/TSdoc, update `docs/CHANGELOG.md`

---

## Conventions & Developer Experience

- **Naming:**
  - Components: PascalCase
  - Utilities: camelCase
  - Pages: kebab-case
- **Linting:** ESLint (`next/core-web-vitals`), Prettier
- **A11y:** Semantic HTML, ARIA, focus management
- **Testing:** Vitest, MSW, `__tests__/`, mock external calls
- **Docs:** JSDoc/TSdoc for all exports, update `docs/CHANGELOG.md`
- **Security:** Never commit secrets; sanitize all user input
- **Style:** Dark, minimalist, mobile-first, accessible

---

## Further Documentation & References

- **Feature Guides:** See `docs/` for booking, payments, subscriptions, auto-cancellation, etc.
- **Changelog:** `docs/CHANGELOG.md`
- **UI Components:** `ui-components.md`, `src/components/ui/`
- **Roadmap:** `docs/roadmap.md`
- **Database Schema:** `supabase-schema.sql`, `supabase/migrations/`
- **API Reference:** See `src/app/api/` and `docs/booking-system-implementation-guide.md`

---

## Quickstart for AI Agents & Developers

1. **Read this file fully.**
2. For new features, follow the workflow in "Adding New Features" above.
3. Reference the docs and code structure for best practices and conventions.
4. When in doubt, search the codebase for similar patterns or consult the relevant doc in `docs/`.

---

*This brief is maintained for AI and human contributors. For deep dives, always check the latest docs and code.*
