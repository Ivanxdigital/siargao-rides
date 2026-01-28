# Siargao Rides Pivot: Backup + Staging Plan (Marketplace → Premium Van Hire + Tours)

Date: 2026-01-28  
Owner: Ivan  
Scope: Preserve the current vehicle-rental marketplace so it can be resumed later, while the primary site pivots to a WhatsApp-first premium private van hire + tours service.

---

## Recommendation (and why)

**Recommended approach: “Legacy branch + separate Vercel project + subdomain”**

- **Keep the current marketplace code intact** on a `marketplace-legacy` branch and tag a known-good snapshot.
- **Deploy it as a separate Vercel project** on a subdomain (e.g., `legacy.<domain>` or `marketplace.<domain>`).
- **Main domain becomes the new van hire + tours site**.

**Why this is best**
- **Fast rollback**: switching traffic back is just a domain / project change.
- **Lowest risk**: no need to rip out marketplace code; preserve everything as-is.
- **Clean brand**: the main domain can be “premium private van + tours” without marketplace UX leaking into navigation/SEO.
- **Optional future re-merge**: when ready, you can rebase/merge work back or simply flip the domain.

**Alternatives**
- **One repo, `/marketplace` path**: doable, but muddier for brand + SEO, and you’ll still maintain both sets of routes.
- **Copy to a new repo**: clean separation, but more operational overhead (duplicated CI/Vercel/env management).

---

## Step-by-step backup plan

### 1) Code snapshot (Git)
Goal: guarantee a recoverable “exact state” of the marketplace.

- Ensure main is in a good state locally (build passes if possible).
- Create a tag and a branch:
  - Tag: `marketplace-v1-2026-01-28`
  - Branch: `marketplace-legacy`

Suggested commands:
```bash
git status
git tag marketplace-v1-2026-01-28
git checkout -b marketplace-legacy
git push origin marketplace-legacy --tags
```

### 2) Configuration snapshot (env + 3rd party settings)
Goal: preserve everything that is not in Git.

- Save a secure copy of:
  - `.env.local` (and any Vercel env vars)
  - Supabase project ref + settings
  - Resend config (domain, API key name, templates)
  - Any analytics pixels / tracking IDs

Practical method:
- Create `docs/ops/env-snapshot.md` (do **not** commit secrets) with:
  - variable names (not values)
  - where they live (local, Vercel, etc.)
  - who owns access

### 3) Data snapshot (Supabase)
Goal: preserve data needed to fully restore marketplace behavior later.

Minimum backup:
- Database schema + data dump
- Storage buckets (vehicle images, shop logos, etc.)

Suggested approaches:
- Prefer Supabase dashboard backups if enabled (scheduled backups).
- If using local Supabase CLI:
  - `supabase db dump` to a timestamped file under `/tmp` or a private backup folder
  - export storage via the dashboard or a small admin script (if needed)

### 4) Deployment snapshot (Vercel)
Goal: ensure the marketplace stays deployable.

- Create a **new Vercel project**: `siargao-rides-legacy` (example name)
- Connect it to the same repo but use:
  - production branch = `marketplace-legacy`
- Assign a subdomain:
  - `legacy.<domain>` (recommended), or `marketplace.<domain>`
- Set `robots` for legacy to **noindex** (optional but recommended if you don’t want it competing with the new SEO).

### 5) Minimal “freeze” hardening (optional)
Goal: reduce support burden while it’s on hold.

- Disable new marketplace growth hooks:
  - Remove prominent “List your vehicles” CTAs (or mark as “Paused”)
  - Keep “Contact” and an “Interested?” WhatsApp link
- Add a small banner:
  - “Marketplace is temporarily paused — we currently offer private van hire + tours.”

---

## Staging strategy for the new site

- Create a long-lived branch for the pivot work: `van-hire-pivot`
- Use Vercel preview deployments for iteration.
- Only merge to `main` when:
  - PRD acceptance criteria is met
  - navigation no longer surfaces marketplace flows
  - WhatsApp CTAs are working and tracked

---

## Website adaptation plan (UI + copy)

Goal: reuse the current design system (Tailwind/shadcn components, existing typography, spacing, animations where appropriate) but make the **primary experience** “premium van hire + tours”.

MVP edits (recommended order):

1) **Navigation and IA**
- Update main nav to: Home, Airport Transfer, Private Van Hire/Land Tour, Tours, Contact/WhatsApp.
- Remove/hide marketplace links (Browse, Booking, List Your Vehicles, Dashboard) from public navigation.

2) **Homepage pivot**
- Replace marketplace search-led hero with a service-led hero:
  - Headline: private airport transfers + private tours
  - Clear fixed prices (₱3,000 Airport ↔ General Luna, ₱8,000 all-day private hire)
  - Primary CTA: WhatsApp (pre-filled)
- Add service cards: Airport Transfer, Private Hire/Land Tour, Island Hopping & Tours.
- Add “How it works” (WhatsApp → quote → confirm) + reconfirmation policy snippet.

3) **Service pages alignment**
- Update `/airport-transfer-siargao` copy + structured data to match:
  - ₱3,000 Airport ↔ General Luna (one-way)
  - other routes → quote via WhatsApp
- Update `/private-van-hire-siargao` to match:
  - ₱8,000 all-day private hire/land tour (temporary)
  - sample itineraries (examples only)
- Add a dedicated tours overview page (recommended):
  - `/tours-siargao` listing main tour types + “starting from” ranges + WhatsApp CTA

4) **Conversion UX**
- Add a sticky/floating WhatsApp button on all pages (mobile-first).
- Standardize the WhatsApp message template so operators always receive the same minimum info.

5) **SEO clean-up**
- Update `sitemap` generation to exclude legacy marketplace routes on the main domain.
- If legacy is not moved to a subdomain immediately, mark marketplace pages `noindex` temporarily.

---

## Pivot cutover checklist

- [ ] Main domain points to new Vercel project (van hire + tours)
- [ ] Legacy marketplace lives on subdomain (optional noindex)
- [ ] 404s avoided via redirects (or clear navigation removal)
- [ ] WhatsApp CTA works on mobile + desktop (deep link)
- [ ] Pricing copy matches current offer:
  - Airport → General Luna: ₱3,000 one-way
  - All-day private hire/land tour: ₱8,000
- [ ] Policy copy included:
  - Cash on pickup
  - Re-confirmation required a few hours before pickup if no reservation fee is collected
  - No reconfirmation → booking auto-cancelled
