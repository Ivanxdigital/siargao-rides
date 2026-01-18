# Shop Owner Onboarding Refactor Spec (Unverified Listings + <1-Minute Setup)

> **Status**: Draft (approved direction; pending implementation)  
> **Last updated**: 2026-01-18  
> **Goal**: Make shop signup < 1 minute and first listing equally fast, while allowing **public visibility + bookings** for **unverified** shops/vehicles (with clear badges + disclaimers).  
> **Hard constraint**: **Do not change the database schema**. If we later decide we must, document the reason first.

---

## 1) Problem Statement

Rental businesses experience high friction in the current flow:
- They can create an account and even add inventory, but **often don’t appear publicly** until verification → weak “instant payoff”.
- “Add vehicle” currently requires **photos + registration docs** upfront → first listing is slow.
- Business intent can be lost on **Google sign-up** → shop owners accidentally become tourists and never see onboarding.
- Verification guidance is inconsistent (links to `/dashboard/verification`, which does not exist in this repo).

This spec refactors onboarding so a business can:
- sign up quickly,
- publish an **unverified** shop and an **unverified** first vehicle quickly,
- become discoverable immediately (with clear trust badges),
- optionally upload docs/photos later to earn “Verified” status and improved ranking.

---

## 2) Product Requirements

### 2.1 Core outcomes
1) **Public visibility**: Unverified shops/vehicles appear in browse/search results with an **Unverified** badge and explanation.
2) **Bookings allowed**: Users can book unverified listings, but we show a clear disclaimer:
   - “This shop is unverified. Siargao Rides does not take accountability for disputes.”
3) **Speed**:
   - Signup to “shop published” target: **< 60 seconds** for a typical shop owner.
   - “First vehicle published” target: **< 60 seconds** after shop creation.

### 2.2 Trust UX (badges + filters)
- Every shop card and shop page must show one of:
  - **Verified** (current)
  - **Unverified** (new label for anything not verified)
- Every vehicle card should show:
  - **Verified vehicle** vs **Unverified vehicle** when displayed publicly
- Add a browse/search filter toggle: **“Verified only”** (default OFF).
- Ranking: verified listings should rank above unverified when other signals are equal.

### 2.3 Verification is optional and non-blocking
- No identity verification is required to publish a shop or add vehicles.
- Verification UX should still exist as a “Level up” path:
  - Upload government ID / permits for shop verification (optional).
  - Upload vehicle registration for vehicle verification (optional).
- Admin review remains the source of truth for “Verified”.

---

## 3) Non-Goals (explicitly out of scope)
- Changing Supabase/Postgres schema.
- Building full dispute resolution tooling.
- Changing payment providers or financial flows.
- Overhauling admin verification workflows (keep existing admin pages working).

---

## 4) Constraints & DB Schema Policy

### 4.1 No schema changes
We will implement all changes using existing fields:
- `rental_shops.is_verified`, `rental_shops.status`, `rental_shops.is_active`
- `vehicles.is_verified`, `vehicles.verification_status`, `vehicles.is_available`, `vehicles.documents`, `vehicle_images`

### 4.2 One exception (document-first requirement)
If we later decide we must **store user acknowledgement of the unverified booking disclaimer** (for legal/audit), we may need a DB field on `rentals` (or reuse an existing metadata/notes field if present).
If we reach that point, we must first add a short “Why schema change is required” section to this doc.

---

## 5) Proposed UX Flow (Business Owner)

### 5.1 Entry points
- Primary CTA: “List your vehicles” → goes to a business-focused auth/onboarding entry.
- Support legacy: existing `/sign-up` still works, but must not lose shop_owner intent.

### 5.2 Flow (target ≤ 5 screens)
1) **Auth (fast)**
   - Primary: Continue with Google
   - Secondary: Magic link via email (no password)
   - Ensure “I’m a rental business” intent is preserved for both.

2) **Publish shop (minimal)**
   - Required: `shopName`, `location_area`, `whatsapp_or_phone`
   - Optional: description, socials, logo/banner
   - Result: shop is created as `pending_verification` + **publicly visible as Unverified**

3) **Publish first vehicle (minimal)**
   - Required: vehicle type, category, name/model (can be short), daily price, quantity (default 1)
   - Optional: photos, documents, weekly/monthly, specs
   - Result: vehicle(s) created as **Unverified** and publicly visible

4) **Success screen (“You’re live”)**
   - Shareable shop URL
   - CTA: “Add another vehicle”
   - CTA: “Get Verified” (non-blocking)

5) **Optional: Verification**
   - Upload docs for shop and vehicles
   - Explains benefits: trust badge + improved ranking

---

## 6) Public UX (Tourist)

### 6.1 Browse/search results
- Show both verified and unverified by default.
- Add filter: Verified only.
- Badges:
  - Verified: green
  - Unverified: amber/neutral with tooltip (“Not yet verified by Siargao Rides”)

### 6.2 Shop page
- Always show shop verification status near the name.
- If unverified: show a small “What this means” panel:
  - “This shop has not been verified by Siargao Rides yet.”
  - “You can still book; use your judgment and contact the shop.”

### 6.3 Booking flow disclaimers (unverified)
- If either the shop or the selected vehicle is unverified:
  - show a concise disclaimer callout,
  - require an explicit confirmation (“I understand”) before completing booking.
- Confirmation should be lightweight (no extra form fields).

---

## 7) Implementation Plan (No Code Here; Checklist Only)

### Phase 0 — Measurement & safety rails
- Add funnel events (or logging if analytics isn’t wired yet):
  - `business_auth_started`, `business_auth_completed`
  - `shop_published`, `first_vehicle_published`
  - `booking_unverified_disclaimer_shown`, `booking_unverified_disclaimer_accepted`
- Add a rollback/feature flag plan for “public unverified visibility”.

### Phase 1 — Enable public unverified listings (biggest payoff)
- Update public browse/search queries to include unverified shops/vehicles (still only `is_active=true`).
- Add “Verified only” filter (default OFF).
- Add/standardize badges on cards and pages.

### Phase 2 — Make first listing truly fast
- Update vehicle add flow so **images and documents are optional** for publishing.
  - Keep verification messaging: “Upload documents to get verified faster.”
  - If no photos: use a consistent placeholder image.
- Add “Quick add” mode that defaults to minimal fields; expand for advanced details.

### Phase 3 — Business onboarding polish
- Fix Google sign-up intent so shop owners always land in onboarding.
- Create a real `/dashboard/verification` page for shop owners (status + uploads), or remove/replace all links to it.

---

## 8) Refactor Map (What we expect to touch)

### Auth + intent preservation
- `src/app/sign-up/page.tsx` (business intent UX; reduce friction)
- `src/contexts/AuthContext.tsx` (ensure Google OAuth preserves/sets `role=intent=shop_owner`)
- `src/app/auth/callback/route.ts` (post-OAuth redirect + metadata consistency)

### Shop creation onboarding
- `src/app/dashboard/page.tsx` (entry condition and display order of onboarding components)
- `src/components/shop/QuickStartOnboarding.tsx` (extend/adjust to publish shop + optionally first vehicle)
- `src/app/api/shops/route.ts` (already supports empty verification docs; keep)

### Vehicle creation (make minimal publish possible)
- `src/app/dashboard/vehicles/add/page.tsx` (remove blocking requirements for docs/images; “quick mode”)
- `src/app/api/vehicles/route.ts` (ensure it accepts missing images/docs; set `verification_status` accordingly)

### Public browse/search visibility
- `src/lib/queries/vehicles.ts` and/or `src/app/api/vehicles/browse/route.ts`
- `src/app/api/shops/browse/route.ts`
- `src/app/browse/page.tsx` and shop cards/vehicle cards for badge rendering

### Booking disclaimer
- `src/app/booking/[vehicleId]/page.tsx` (unverified disclaimer gating)
- `src/app/api/create-booking/route.ts` (optional: server-side re-check of verification state)

---

## 9) Acceptance Criteria (Definition of Done)

### Business onboarding
- A shop owner can go from “no account” → “shop published and publicly visible (Unverified)” in ≤ 60 seconds using Google.
- A shop owner can publish a first vehicle without uploading documents/photos.

### Public experience
- Unverified shops/vehicles are visible on browse and shop pages with clear badges.
- There is a “Verified only” filter.

### Booking safety
- When booking an unverified listing, the disclaimer is shown and requires explicit acknowledgement.

### No DB schema changes
- All changes ship without altering migrations or table definitions.

---

## 10) Open Questions (resolve before implementation)
1) Should unverified listings be slightly deprioritized in ranking, or only visually labeled?
2) Should we allow “photo-less” vehicles publicly, or require at least 1 photo (still optional in onboarding, but needed before public visibility)?
3) Do we need to store disclaimer acceptance server-side for legal reasons? (If yes, may require schema or reuse of an existing field.)

---

## Dev Log (keep this up to date)

### Log entry template
- Date:
- Summary:
- Decisions:
- Changes (files):
- Notes / follow-ups:

### 2026-01-18
- Summary: Created spec for “Unverified listings + <1-minute onboarding”, with no DB schema changes.
- Decisions:
  - Unverified listings are publicly visible with badges.
  - Bookings allowed for unverified listings with explicit disclaimer acknowledgement.
  - Verification remains optional and non-blocking.
- Follow-ups:
  - Resolve open questions in section 10 before implementation begins.

### 2026-01-18 (Phase 1 started)
- Summary: Enabled public visibility for unverified listings + added trust badges and verified-only filtering.
- Changes (no DB schema changes):
  - `src/app/api/vehicles/browse/route.ts`: default includes unverified; added `verified_only` filter; included shop verification fields for UI.
  - `src/app/api/shops/browse/route.ts`: locations now include unverified active shops (excludes rejected).
  - `src/lib/api.ts`: public vehicle queries default to include unverified (excludes rejected vehicles/shops); added `verified_only` option.
  - `src/lib/queries/vehicles.ts`: added `verified_only` filter support; removed explicit `any` where touched.
  - `src/components/shop/ShopTrustBadge.tsx`: new reusable Verified/Unverified badge with tooltip.
  - `src/components/VehicleCard.tsx`: shows shop trust badge when shop verification data is available.
  - `src/components/RentalShopCard.tsx`: shows shop trust badge on shop cards.
  - `src/app/browse/page.tsx`: added “Verified only” filter toggle + updated trust copy.
  - `src/app/browse/shops/page.tsx`: updated trust copy and passes `isVerified` into `RentalShopCard`.
  - `src/app/shop/[id]/ShopPageClient.tsx`: always shows Verified/Unverified badge in header.
  - `src/app/page.tsx`: homepage now includes unverified listings (badged) and prefers verified first.

### 2026-01-18 (Phase 2 started)
- Summary: Made first vehicle publishable without photos/documents; added “Quick add mode”; ensured grouped vehicles persist documents + correct verification status.
- Changes (no DB schema changes):
  - `src/app/dashboard/vehicles/add/page.tsx`: images/documents/specs no longer block publish; added quick add toggle; updated verification copy.
  - `src/app/dashboard/vehicles/edit/[id]/page.tsx`: relaxed validations so minimal vehicles can be edited later without forced specs.
  - `src/app/api/vehicles/route.ts`: requires `category_id`; sets `verification_status` based on documents; fixes group creation to persist documents + `documents_needed` when missing.
  - `src/app/api/vehicle-groups/route.ts`: persists grouped vehicle documents + `verification_status` after RPC.
  - `src/app/dashboard/admin/vehicles/verification/page.tsx`: primary image preview now falls back to first image/placeholder reliably.

### 2026-01-18 (Phase 3 started)
- Summary: Added a dedicated business entry point, preserved business intent through Google OAuth, added a “You’re live” success moment, and gated unverified bookings with an explicit disclaimer (no DB changes).
- Changes (no DB schema changes):
  - `src/app/list-your-vehicles/page.tsx`: new business landing CTA for rental businesses.
  - `src/app/auth/callback/route.ts`: OAuth callback now honors `intent` and ensures a `public.users` record exists.
  - `src/contexts/AuthContext.tsx`: Google OAuth supports intent and no longer defaults all new Google users to tourist.
  - `src/app/sign-up/page.tsx` and `src/app/sign-in/page.tsx`: accept `?intent=shop_owner` and pass it through Google auth.
  - `src/app/dashboard/onboarding/success/page.tsx`: “You’re live” success screen with next-step CTAs.
  - `src/components/shop/QuickStartOnboarding.tsx`: redirects to success screen after shop publish.
  - `src/app/dashboard/vehicles/add/page.tsx`: redirects to success after onboarding add; emits lightweight tracking events.
  - `src/components/BookingForm.tsx` and `src/app/booking/[vehicleId]/page.tsx`: unverified booking disclaimer gating + tracking events.
