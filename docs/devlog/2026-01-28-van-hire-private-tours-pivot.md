# 2026-01-28 — Van Hire + Private Tours Pivot (Lead Gen)

## Context
Pivot the main site experience from a vehicle rental marketplace to a **premium, private-only** lead generation site focused on WhatsApp inquiries for:
- private airport transfers
- all-day private van hire / land tours
- private tours (land + island), coordinated via a partnered provider

## What changed
- Replaced the homepage with a service-led landing page optimized for WhatsApp conversion (fixed prices surfaced, private-only positioning).
- Improved the desktop hero layout to feel more balanced and premium (two-column layout with a dedicated “Quick prices” panel; removed excess vertical gap by keeping primary CTA + trust chips within the left column on desktop).
- Updated global SEO metadata (site title/description/keywords) to match the new offering.
- Updated navigation + footer to prioritize Airport Transfer, Private Van Hire, and Private Tours; added a prominent WhatsApp CTA.
- Aligned service pages to current pricing:
  - Airport ↔ General Luna: **₱3,000 one-way**
  - All-day private van hire: **₱8,000 all day** (temporary rate)
- Added a new private tours page (`/tours-siargao`) with private-only messaging and WhatsApp quote CTAs.
- Standardized WhatsApp deep-link creation and default lead message.
- Simplified sitemap to focus on the new lead-gen routes (removed marketplace/dynamic entries).

## Key files touched
- `src/app/page.tsx` (new homepage)
- `src/app/layout.tsx` (global metadata)
- `src/components/layout/Navbar.tsx` (nav + WhatsApp CTA)
- `src/components/layout/Footer.tsx` (footer links + WhatsApp link)
- `src/lib/whatsapp.ts` (WhatsApp URL + message helpers)
- `src/app/airport-transfer-siargao/page.tsx`, `src/app/airport-transfer-siargao/airport-transfer-client.tsx`
- `src/app/private-van-hire-siargao/page.tsx`, `src/app/private-van-hire-siargao/private-van-hire-client.tsx`
- `src/app/tours-siargao/page.tsx` (new)
- `src/app/contact/page.tsx`, `src/app/contact/contact-client.tsx` (WhatsApp-first contact)
- `src/app/sitemap.ts` (static lead-gen sitemap)

## Notes / Breaking changes
- Marketplace pages/routes still exist in the codebase, but they are no longer linked from primary navigation.
- Contact form was removed in favor of WhatsApp-first booking (intentional per PRD).
- Lint currently reports pre-existing issues across the repo; build succeeds with lint/type checks skipped.

## Verification
- `npm run build`

## Follow-ups
- Add event tracking for WhatsApp clicks (e.g., `whatsapp_cta_click` with page + placement).
- Decide whether to keep legacy marketplace indexed (recommend deploying legacy on a subdomain with `noindex`).
- Revisit tour pricing once partner rate card is confirmed (keep quote-based until then).
