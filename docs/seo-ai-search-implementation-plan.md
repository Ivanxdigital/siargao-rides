# SEO + AI Search Implementation Plan

## Objective
Build a high-converting, premium-feeling, mobile-first website that ranks for high-intent queries around private van services in Siargao, while remaining minimalist, trustworthy, and visually cohesive with the current brand theme.

Primary goals:
- Increase qualified organic traffic for commercial-intent terms.
- Increase quote requests and WhatsApp booking starts.
- Improve eligibility for Google rich features and AI-generated answers.

## Business + User Positioning
- Audience: travelers and groups who value comfort, reliability, and convenience over lowest price.
- Core offer: private van airport transfer + private 8-hour day hire.
- Brand promise: premium, reliable, easy booking, transparent rates.

## SEO Strategy Principles
- Build pages by **intent cluster**, not keyword variants.
- Avoid thin or near-duplicate pages (doorway-page risk).
- Match each page to one primary intent and 2-5 close secondary intents.
- Keep copy specific, factual, and conversion-focused (not generic tourism fluff).

## Target Query Clusters
1. Private van hire intent
- Primary: `private van hire siargao`
- Secondary: `van hire in siargao`, `private van service siargao`, `siargao private transfer`

2. Airport transfer intent
- Primary: `private van pick up service siargao`
- Secondary: `siargao airport transfer`, `iao airport transfer`, `private airport transfer siargao`

3. Land tour/day hire intent
- Primary: `land tours siargao`
- Secondary: `private land tour siargao`, `8 hour van hire siargao`, `siargao day tour private van`

## Information Architecture (Planned URLs)
- `/` (homepage: broad commercial hub + trust + navigation)
- `/private-van-hire-siargao` (service page: private van hire)
- `/airport-transfer-siargao` (service page: airport pickup/dropoff)
- `/land-tours-siargao` (service page: private day hire / land tours)
- `/about` (trust, operations, reliability, standards)
- `/faq` (expanded operational FAQ)
- Optional only with unique content: route pages (for example `/iao-to-general-luna-private-transfer`)

Rules for adding optional route pages:
- Must include unique route-specific travel time, pickup notes, edge cases, pricing logic, and FAQ.
- Must not be templated clones with only city names swapped.

## Page-Level Content Blueprint
Each money page should keep a consistent skeleton for trust and UX flow, but unique copy and proof blocks.

Common section flow:
1. Hero with exact intent match in H1.
2. Quick trust bar (private rides, response time, local drivers).
3. Service details (what is included/excluded).
4. Ideal-for block (who this is best for).
5. Pricing logic and examples.
6. Process (book in 3 steps).
7. FAQ specific to that intent.
8. Strong WhatsApp CTA.

Unique sections per page:
- `private-van-hire`: comfort and premium positioning, group/luggage scenarios.
- `airport-transfer`: flight delays, airport meet points, arrival/departure workflows.
- `land-tours`: sample itineraries, time planning, flexibility boundaries.

## Copy Framework (Premium + Minimalist)
- Tone: calm, precise, confident, hospitality-driven.
- Sentence style: short, clear, non-hype.
- Emphasis: reliability, punctuality, comfort, door-to-door simplicity.
- Avoid: exaggerated claims, keyword stuffing, long dense paragraphs.

Copy rules:
- Primary keyword in H1, intro paragraph, one H2, meta title, meta description, and URL slug.
- Use close variants naturally in body copy and FAQ.
- Add concrete specifics (areas served, luggage handling, response windows, day-hire limits).

## Design + UX System (Mobile-First, Premium)
Keep the current visual theme: slate neutrals + emerald accent + large radii + restrained motion.

Design constraints:
- Minimalist first: fewer elements, stronger hierarchy, more whitespace.
- Premium feel: polished typography rhythm, stronger trust cues, fewer but sharper CTAs.
- Mobile-first layouts designed intentionally (not desktop shrunk down).

Responsive behavior:
- 360/390: stacked sections, persistent bottom CTA, compact trust modules.
- 768: dual-column transitions for service/proof blocks.
- 1024+: richer composition, larger visual anchors, stable reading width.

Section uniqueness with visual continuity:
- Keep shared container/grid system and typography scale.
- Differentiate each section with alternating background tone, icon treatment, and media layout pattern.
- Use only 2-3 animation patterns site-wide (reveal, fade-up, CTA emphasis).

## Technical SEO Implementation
1. Metadata foundation
- Add `metadataBase` from `NEXT_PUBLIC_SITE_URL`.
- Add canonical URLs per page using `alternates.canonical`.
- Add page-specific title/description/Open Graph/Twitter metadata.

2. Crawl + index control
- Add `src/app/robots.ts`.
- Add `src/app/sitemap.ts` with all core URLs and `lastModified`.
- Ensure all key pages are internally linked from nav/footer/context links.

3. Structured data
- Keep `LocalBusiness` and align with visible on-page facts.
- Add `Service` schema on each service page.
- Add `BreadcrumbList` on service pages.
- Keep FAQ schema only where FAQ content exists on page.

4. Performance and rendering
- Keep money-page copy server-rendered.
- Maintain optimized `next/image` usage and sizes.
- Avoid heavy client bundles in above-the-fold sections.

## AI Search Readiness
- Keep factual Q&A blocks with concise direct answers.
- Make service details explicit and machine-extractable (inclusions, exclusions, areas served, hours, pricing logic).
- Keep structured data tightly aligned with visible text.
- Maintain clean internal linking between related intents.
- Avoid hidden or JS-only critical content.

## Local SEO + Off-Page Support
1. Google Business Profile alignment
- Keep NAP/contact/hours/service areas consistent with site.
- Map service descriptions to the same terms used on money pages.

2. Trust signal expansion
- Add real testimonials with specific use cases (airport pickup, day tours, group comfort).
- Add lightweight partner/recommendation mentions if verifiable.

3. Citations and references
- Ensure consistent business details in local directories and social profiles.

## Conversion Optimization Plan
- Keep one primary CTA language pattern: `Get Quote on WhatsApp`.
- Add secondary CTA only where needed: `View Rates` or `Check Coverage`.
- Track CTA clicks, form starts, and completed WhatsApp open events.
- Add friction-reduction microcopy: no payment to request quote, response-time expectation.

## Analytics + KPI Tracking
Primary KPIs:
- Organic clicks and impressions by landing page.
- Rankings for intent-cluster primary keywords.
- WhatsApp CTA click-through rate.
- Quote-form completion rate.

Implementation:
- GA4 events: `whatsapp_cta_click`, `quote_form_submit`, `section_cta_click`.
- Google Search Console page/query tracking by URL cluster.
- Monthly SEO scorecard by page type.

## Execution Phases
## Phase 1: Foundation (Week 1)
- Create URL architecture and route files.
- Add metadata system, canonical setup, robots, sitemap.
- Build shared SEO helper utilities/constants.

Acceptance:
- All planned pages exist with unique metadata.
- Sitemap and robots are valid and discoverable.

## Phase 2: Core Service Pages (Week 1-2)
- Build `/private-van-hire-siargao`.
- Build `/airport-transfer-siargao`.
- Build `/land-tours-siargao`.
- Add unique copy, FAQ, CTAs, and Service schema for each page.

Acceptance:
- No duplicated copy blocks across service pages beyond shared trust/process snippets.
- Each page has distinct H1, meta, FAQ, and pricing/service details.

## Phase 3: UX + Visual Polish (Week 2)
- Refine mobile-first spacing/typography.
- Ensure section uniqueness while preserving theme consistency.
- Tune motion for polish without performance penalties.

Acceptance:
- Strong visual quality at 360, 390, 768, 1024, 1440 widths.
- Minimalist premium look maintained on both mobile and desktop.

## Phase 4: Authority + Local Trust (Week 2-3)
- Add `about` and expanded `faq` pages.
- Add testimonials and operational trust details.
- Align site copy with Google Business Profile terminology.

Acceptance:
- Clear trust and entity signals across the site.
- Consistent local business details across key pages.

## Phase 5: Measurement + Iteration (Week 3+ ongoing)
- Ship analytics events and dashboard baseline.
- Monitor page/query performance and adjust internal links/copy.
- Decide if optional route pages are justified by data.

Acceptance:
- Monthly iteration cycle with documented SEO and conversion deltas.

## Development Checklist
- [ ] Add per-page metadata exports (`title`, `description`, OG, canonical).
- [ ] Add `metadataBase` and environment fallback handling.
- [ ] Add `robots.ts` and `sitemap.ts`.
- [ ] Add shared schema builders (`LocalBusiness`, `Service`, `BreadcrumbList`, `FAQPage`).
- [ ] Build three core intent pages with unique copy and layout emphasis.
- [ ] Add internal linking module (`Related Services` + footer links).
- [ ] Add analytics event instrumentation for key CTAs.
- [ ] Validate mobile performance and accessibility before launch.

## QA Checklist
- [ ] No duplicate titles/descriptions across money pages.
- [ ] Every money page has one clear H1 with intent match.
- [ ] Canonicals resolve correctly in rendered HTML.
- [ ] Schema validates and mirrors visible content.
- [ ] Links are crawlable and not JS-dependent.
- [ ] Mobile sticky CTA does not block form fields or footer actions.
- [ ] Core Web Vitals and Lighthouse remain in target range.

## Risks + Mitigation
- Risk: accidental doorway-style duplication.
- Mitigation: require unique section set + unique FAQ + unique service details before publishing any new page.

- Risk: visual inconsistency from adding many pages quickly.
- Mitigation: reuse a shared section system with controlled variants only.

- Risk: traffic growth without conversion lift.
- Mitigation: track WhatsApp/quote funnel from day one and optimize CTA placement/microcopy iteratively.

## Definition Of Done
- Three core service intent pages are live and interlinked.
- Technical SEO baseline is complete (canonical, sitemap, robots, structured data).
- Mobile and desktop experiences are premium, minimalist, and conversion-focused.
- Tracking and monthly optimization loop are in place.
