# Landing Page Rebuild Spec (Next.js + Tailwind + Framer Motion + shadcn)

## Goal
Recreate `generated-page.html` in our current stack with high visual parity, while making it production-ready for performance, accessibility, and responsive behavior on mobile and desktop.

## Source Of Truth
- Visual/content reference: `generated-page.html`
- Current app entry: `src/app/page.tsx`
- Global styles/theme: `src/app/globals.css`

## Output Requirements
- Match layout, hierarchy, copy, spacing, color tone, and CTA flow from the reference.
- Keep all current sections and anchors:
  - Announcement bar
  - Sticky nav
  - Mobile sticky CTA
  - Hero
  - Trust strip
  - Services
  - Why choose us
  - How it works
  - Pricing + quote form
  - FAQ
  - Final CTA
  - Footer
- Keep WhatsApp-first conversion flow (prefilled message generation from form).
- Mobile and desktop must both feel intentionally designed (not just scaled).

## Technical Approach
1. Build the page with Server Components by default.
2. Isolate interactivity in a small Client Component only for:
   - Quote form state
   - WhatsApp message generation and open action
   - Optional lightweight reveal animations
3. Use `next/image` for hero and supporting imagery.
4. Use shadcn primitives where they reduce custom UI risk:
   - `Button`, `Input`, `Label`, `Select`, `Separator`, optionally `Card`
5. Use Framer Motion sparingly for staged reveal and CTA polish.

## Proposed File Structure
- `src/app/page.tsx` (page composition, mostly server-rendered)
- `src/components/landing/announcement-bar.tsx`
- `src/components/landing/site-nav.tsx`
- `src/components/landing/mobile-sticky-cta.tsx`
- `src/components/landing/hero-section.tsx`
- `src/components/landing/trust-strip.tsx`
- `src/components/landing/services-section.tsx`
- `src/components/landing/why-section.tsx`
- `src/components/landing/how-it-works-section.tsx`
- `src/components/landing/pricing-section.tsx`
- `src/components/landing/faq-section.tsx`
- `src/components/landing/final-cta-section.tsx`
- `src/components/landing/site-footer.tsx`
- `src/components/landing/quote-form.tsx` (client component)
- `src/components/landing/landing-data.ts` (copy, links, prices, FAQ, nav items)

## Design Parity Tokens (from reference)
- Core palette: `slate` neutrals + `emerald` CTA accent.
- Container widths: mostly `max-w-6xl`, FAQ `max-w-3xl`.
- Vertical rhythm: major sections at `py-24`.
- Rounded language: pills and large radii (`rounded-full`, `rounded-3xl`).
- Sticky nav with blur and border.
- Mobile floating CTA (`md:hidden`, bottom fixed).
- Typography style: tight tracking for headings, calmer body text.

## Performance Plan
- Replace external image URLs with optimized local assets where possible, or allowlisted remote domains with `next/image`.
- Use image sizing and priorities intentionally:
  - Hero image: `priority` + responsive `sizes`
  - Secondary image: lazy default
- Avoid runtime icon script (`iconify`); use tree-shakeable `lucide-react`.
- Keep animation budget small:
  - Limit simultaneously animated elements
  - Use transform/opacity only
  - Honor `prefers-reduced-motion`
- Avoid unnecessary client boundaries; keep static sections server-rendered.
- Validate:
  - Lighthouse mobile Performance >= 90
  - Accessibility >= 95
  - Best Practices >= 95
  - SEO >= 95

## Responsive Plan
- Breakpoints: mobile-first with `sm`, `md`, `lg`.
- Ensure parity behaviors:
  - Desktop nav links visible; mobile nav simplified
  - Mobile sticky CTA visible only below `md`
  - Multi-column sections collapse cleanly to one column on smaller viewports
  - Form fields stack naturally at mobile widths
- Validate at minimum widths:
  - 360px
  - 390px
  - 768px
  - 1024px
  - 1440px

## Accessibility Plan
- Semantic landmarks: `header`, `nav`, `main`, `section`, `footer`.
- Clear heading structure (`h1` -> `h2` -> `h3`).
- Keyboard focus visible for all interactive controls.
- Button/link semantics correct (no fake links for actions).
- Form labels tied to inputs.
- External links with safe target attributes when needed.
- Respect reduced motion settings.

## SEO And Metadata Plan
- Set page metadata in `src/app/layout.tsx` or page metadata export:
  - Title
  - Description
  - Open Graph basics
- Preserve meaningful alt text for images.
- Keep copy crawlable (not hidden behind client-only rendering).

## Implementation Phases
1. Foundation
   - Prepare folders and data constants.
   - Configure image domains if remote assets are retained.
2. Static Section Build
   - Build all sections with parity-first layout and styling.
3. Interactive Layer
   - Implement `quote-form.tsx` with WhatsApp prefilled message builder.
4. Animation Pass
   - Add Framer Motion reveal/entrance effects matching reference feel.
5. Accessibility Pass
   - Keyboard/focus/label checks and reduced-motion behavior.
6. Performance Pass
   - Image sizing, bundle checks, remove unnecessary client code.
7. QA + Polish
   - Mobile/desktop diff pass vs `generated-page.html`
   - Final spacing and typography tuning.

## Acceptance Criteria
- Visual parity with `generated-page.html` at key breakpoints.
- All anchor links and CTA paths work.
- Quote form builds a valid WhatsApp message with encoded user inputs.
- No layout breakage on mobile or desktop.
- Production build passes (`npm run build`).
- Lint passes (`npm run lint`).
- Performance and accessibility targets met or documented with tradeoffs.

## Notes / Risks
- The reference currently uses external image URLs and script-based icons; we will replace these with optimized equivalents.
- Currency symbols in the reference file show encoding artifacts; we will use clean UTF-8 text in React source.
- Exact pixel parity may require one focused polish pass after first implementation.
