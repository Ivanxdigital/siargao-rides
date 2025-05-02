# Siargao Rides – Simplified Shop-Owner Onboarding  
_Last updated 27 Apr 2025_

## 0. Goal
Cut the old two-stage flow (sign-up ➜ “Register Shop” page ➜ wait for admin) down to a single, friction-free path:

1. **User signs up** and chooses **“List my vehicles”** intent.  
2. We **auto-assign `role = "shop_owner"`** (but `has_shop = false`).  
3. After email verification the user lands on the **Dashboard**.  
4. A **collapsible onboarding banner** at the top collects all shop details (same fields as the legacy `/register` page).  
5. When the form is submitted we create the shop with `status = "pending_verification"` and flip `has_shop = true`.  
6. The banner then shows a “Verification pending” state and hides once approved.

## 1. Files / Context the agent MUST read
| Area | Key files to open |
| ---- | ----------------- |
| Sign-up flow | `app/(auth)/signup/page.tsx` or `SignUpForm.tsx` |
| User auth / roles | `/supabase/migrations/**/users.sql` (look for `role`, `intent`, triggers) |
| Dashboard | `app/(dashboard)/shop/page.tsx` (uploaded as **page.tsx**), `layout.tsx`, `components/shop/OnboardingGuide.tsx`, `ShopSetupGuide.tsx`, `utils/shopSetupStatus.ts` |
| Register page (legacy) | `app/register/page.tsx` (holds current form) |
| API routes | Anything under `app/api/shop**` that creates/updates shops |

> **If any file above is missing**, pause and ask the human for it before proceeding.

## 2. Implementation Steps

### 2.1 Update the sign-up form
1. Add a **radio-group** (`intent`) with options  
   - “Book rentals” (`"renter"`) – default  
   - “List my vehicles” (`"shop_owner"`)
2. On submit, pass `intent` to Supabase via `metadata`.
3. **Supabase `auth` trigger** (`on_signup`) → if `intent = "shop_owner"`  
   - set `role = shop_owner`  
   - set `has_shop = false`

### 2.2 Email-verified redirect
*Ensure the auth callback already points to `/dashboard`; if not, update the `NEXT_PUBLIC_SUPABASE_REDIRECT_URL`.*

### 2.3 Collapsible onboarding banner
1. **Component:** `components/shop/ShopOnboardingBanner.tsx`
2. Uses **Framer Motion** for slide-down / collapse.  
3. Visible only when `role = shop_owner` **AND** `has_shop = false`.
4. Form fields (reuse from legacy register page):  
   - Shop name, description, contact, address, ID upload, docs, etc.  
   - Validation with `react-hook-form + zod`.
5. POST to `/api/shop/create` ➜ returns `shopId`, `status = pending_verification`.
6. On success:  
   - Flip `has_shop = true` in `public.users` (or metadata).  
   - Show “Waiting for verification” notice with subdued style.  
   - Collapse banner automatically.

### 2.4 Dashboard tweaks
* Remove the “Register your shop” hero CTA (line ~-100 from bottom of current **page.tsx**).  
* Add a small “Manage Shop ➜” button once verified.

### 2.5 Clean-up / Deprecation
* Mark `/register` route as deprecated ➜ redirect to `/dashboard` if visited by shop_owner without shop.

## 3. Database & Auth
| Table | New / changed columns |
| ----- | --------------------- |
| `public.users` | `intent` (text), `has_shop` (bool, default false) |
| `shops` | `status` enum (`pending_verification`, `active`, `rejected`) |

Add/adjust RLS policies so only:
* the owner can `select/update` their own unverified shop record,
* admins can review/approve.

## 4. UX / UI Notes
* Dark theme, Tailwind.  
* Banner width: full, inside dashboard container.  
* Collapse control: chevron icon right-aligned.  
* Micro-animations **≤ 300 ms**, ease-in-out.

## 5. Testing Checklist
- [ ] Sign-up as renter ➜ no banner.
- [ ] Sign-up as shop_owner ➜ banner shown.
- [ ] Collapse / expand state remembered in `localStorage`.
- [ ] Submit form ➜ toast success, banner switches to “pending”.
- [ ] Admin approves ➜ banner disappears, dashboard shows shop stats.
- [ ] Old `/register` route now redirects.

## 6. Roll-back Plan
Deploy behind feature flag `ONBOARDING_V2`.  
If issues arise, toggle flag to restore old flow.

---

### ⏩ Agent Execution Sequence

```text
1. gather_context:
   open all files in §1.
2. plan:
   outline code edits, schema migration, feature flag.
3. implement:
   - modify sign-up UI & handler
   - write DB migration (SQL file + Supabase CLI)
   - create ShopOnboardingBanner component
   - adjust dashboard page & redirect
   - update RLS policies
4. unit-test locally (Supabase emulator)
5. commit with message "feat: streamlined shop-owner onboarding (#ONBOARDING_V2)"