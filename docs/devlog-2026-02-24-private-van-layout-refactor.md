# Devlog - 2026-02-24 - Private Van Hire Page Layout Refactor

## Summary
Refactored `/private-van-hire-siargao` from the shared service template into a dedicated, mobile-first page layout with distinct structure, richer conversion flow, and premium-feeling subtle motion.

## Major UI/UX Improvements
- Replaced the generic template hero with a unique split hero layout:
  - intent-focused copy, proof chips, and dual CTA actions on the left
  - visual and pricing summary card on the right
- Added a page-local anchor strip (`Comparison`, `Capacity`, `Use Cases`, `FAQ`) to improve mobile navigation and section discovery.
- Introduced a dedicated `Private Van vs Alternatives` comparison section to support decision-making quickly.
- Added `Group Size and Luggage Planning` with clear capacity scenarios and a sticky booking snapshot panel on desktop.
- Added `Built for High-Comfort Trip Scenarios` use-case cards to align service value with common traveler intents.
- Preserved high-clarity booking content sections (`What's Included`, `Booking Notes`, `FAQ`, `Related Services`) with improved flow.

## Motion and Visual Polish
- Added staggered reveal animations via existing `Reveal` component across key sections/cards.
- Added subtle premium interactions:
  - hover elevation and micro-lift on use-case cards
  - smooth shadow transitions on planning and related-service cards
- Maintained reduced-motion compatibility through existing `Reveal` behavior.

## Refactoring Notes
- Added dedicated page component:
  - `src/components/service-pages/private-van-service-page.tsx`
- Updated route page wiring:
  - `src/app/private-van-hire-siargao/page.tsx` now renders `PrivateVanServicePage`
- Kept metadata strategy unchanged for canonical/open graph continuity.
- Preserved structured data output (Service, FAQ, Breadcrumb JSON-LD).

## Validation
- `npm run lint` passed.
- `npm run build` passed.
- Confirmed static route generation includes `/private-van-hire-siargao`.
