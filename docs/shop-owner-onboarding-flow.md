# Shop Owner Onboarding Flow

This document outlines the process for a user signing up with the intent to list vehicles (become a shop owner) on the Siargao Rides platform.

## 1. Sign-Up Intent

- **File:** `src/app/sign-up/page.tsx`
- **Process:**
    - User selects the "List My Vehicles" option on the sign-up form.
    - This sets the `userIntent` state to `shop_owner`.
    - Upon successful registration using the `useAuth` context (`register` function):
        - The user's record in `auth.users` is created with `user_metadata.role` and `user_metadata.intent` set to `shop_owner`.
        - A request is sent to `/api/send-onboarding-email` to trigger the welcome/instructional email.

## 2. Onboarding Email

- **API Route:** `src/app/api/send-onboarding-email/route.ts`
- **Email Template:** `src/emails/ShopOwnerOnboardingEmail.tsx`
- **Process:**
    - The API endpoint receives the new user's email and first name.
    - It uses the Resend service to send the `ShopOwnerOnboardingEmail`.
    - The email welcomes the user, explains the need to complete shop registration (listing info, ID verification), and provides a call-to-action button.
    - **Note:** The call-to-action button now correctly links to the user's dashboard (`/dashboard`).
    - The API attempts to update the `users` table record for the user to mark `onboarding_email_sent` as `true`.

## 3. Dashboard Onboarding Form

- **Component:** `src/components/shop/ShopOnboardingBanner.tsx`
- **Display Logic:**
    - Rendered prominently in the dashboard (`/dashboard/page.tsx`, integrated via `src/app/dashboard/layout.tsx`).
    - Visible only if `user.user_metadata.role === 'shop_owner'` AND `user.user_metadata.has_shop !== true`.
- **Functionality:**
    - Presents a form managed by `react-hook-form` and validated by `zod`.
    - Collects essential shop details: Shop Name, Description, Address, Location Area, Phone, Owner Name, Email.
    - Collects optional details: WhatsApp, Facebook URL, Instagram URL, Referral Code/Email.
    - Requires upload of a Government ID (validated for size and type).
    - Validates referral code/email against the `users` table if provided.
- **Submission:**
    - On submit, it first uploads the Government ID to Supabase Storage (`shop-documents` bucket).
    - Sends a `POST` request to `/api/shops` with the collected form data and the public URL of the uploaded ID.
- **Post-Submission:**
    - If the API call is successful:
        - The banner updates to show a "Pending Verification" status.
        - It calls `supabase.auth.updateUser` to set `user_metadata.has_shop = true` in the user's Auth record. This hides the banner on subsequent visits/refreshes.
        - It calls an `onComplete` prop (likely passed from the dashboard page) to trigger a state refresh.
        - The banner collapses automatically after a short delay.

## 4. Shop Creation API

- **API Route:** `src/app/api/shops/route.ts`
- **Process:**
    - Receives the shop data payload from the `ShopOnboardingBanner` form.
    - Verifies the `owner_id` corresponds to an existing user in the `users` table.
    - Validates the `verification_documents` object (ensuring `government_id` URL is present).
    - Inserts a new record into the `rental_shops` table with `status` set to `pending_verification`.
    - Updates the user's record in the `users` table, setting `has_shop = true`.
    - Uses the Supabase Admin client to update the user's `auth.users` record, setting `user_metadata.has_shop = true`.
    - Sends an admin notification (likely via `/api/send-admin-notification`) about the new shop requiring verification.
    - Returns the newly created shop data or an error to the client.

## 5. Post-Verification & Further Onboarding

- **Verification:** Handled by admins, likely through a dedicated interface (`/dashboard/admin/verification`), setting `rental_shops.status` to `active`.
- **Onboarding Guide:** `src/components/shop/OnboardingGuide.tsx`
    - This component appears designed to guide the user *after* the initial shop record is created and potentially verified.
    - It tracks completion of steps like adding vehicles, logo, banner, description, location, and contact info (likely fetched from the `rental_shops` data).
    - Provides links to `/dashboard/vehicles/add` and `/dashboard/shop` to complete these steps.
    - Displays subscription status warnings if applicable.
    - Can be dismissed by the user (state saved in `localStorage`).

## Associated Files

- `src/app/sign-up/page.tsx` (Intent selection)
- `src/contexts/AuthContext.tsx` (Handles registration logic, setting metadata)
- `/api/send-onboarding-email/route.ts` (Sends initial email)
- `src/emails/ShopOwnerOnboardingEmail.tsx` (Email template)
- `src/app/dashboard/layout.tsx` (Integrates banner/guide)
- `src/app/dashboard/page.tsx` (Fetches data, conditionally renders banner/guide)
- `src/components/shop/ShopOnboardingBanner.tsx` (The main onboarding form)
- `/api/shops/route.ts` (Backend processing for shop creation)
- `src/components/shop/OnboardingGuide.tsx` (Step-by-step setup guide)
- `src/lib/constants.ts` (Contains `SIARGAO_LOCATIONS`)
- `src/lib/validation.ts` (Contains Zod schema for `verificationDocumentsSchema`)
- `src/lib/admin.ts` (Provides `supabaseAdmin` client)
- `src/lib/notifications.ts` (Contains `sendAdminNotification` function)
- Supabase Tables: `auth.users`, `public.users`, `public.rental_shops`
- Supabase Storage Bucket: `shop-documents`

## Flow Diagram (Simplified)

```mermaid
graph TD
    A[Sign Up Page: Selects 'List My Vehicles'] --> B(AuthContext: Register User);
    B --> C{Set auth.users metadata: role='shop_owner'};
    B --> D[API: /api/send-onboarding-email];
    D --> E[Email: ShopOwnerOnboardingEmail Sent];
    C --> F[Dashboard Page: User logs in];
    F --> G{Check: role='shop_owner' AND has_shop != true?};
    G -- Yes --> H[Display ShopOnboardingBanner];
    H --> I{Fill & Submit Form (incl. ID Upload)};
    I --> J[API: /api/shops POST];
    J --> K[DB: Insert rental_shops (status='pending_verification')];
    J --> L[DB: Update users table (has_shop=true)];
    J --> M[Auth: Update user metadata (has_shop=true)];
    J --> N[Notify Admins];
    M --> O[Dashboard Page: Reload/Refresh];
    O --> P{Check: role='shop_owner' AND has_shop != true?};
    P -- No --> Q[Hide ShopOnboardingBanner];
    Q --> R[Display OnboardingGuide (Optional/Conditional)];
    R --> S[User completes steps: Add Vehicles, Logo, etc.];
    N --> T[Admin Verification];
    T --> U[DB: Update rental_shops (status='active')];

    style H fill:#f9f,stroke:#333,stroke-width:2px
    style R fill:#ccf,stroke:#333,stroke-width:2px
```

## Potential Improvements

1.  ~~**Business Permit:** Either add the Business Permit upload field to `ShopOnboardingBanner.tsx` or remove the mention from `ShopOwnerOnboardingEmail.tsx` for consistency.~~ (Removed from email)
2.  ~~**Guide Integration:** Clarify when `OnboardingGuide.tsx` is shown relative to the `ShopOnboardingBanner.tsx`. Consider showing it *after* the banner is completed/hidden.~~ (Implemented in dashboard page logic)
3.  **Error Handling:** Ensure robust error handling and user feedback throughout the process (e.g., if ID upload fails, if API calls fail). 