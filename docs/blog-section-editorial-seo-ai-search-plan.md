# Blog Section Editorial SEO + AI Search Plan

## Companion spec
- Visual and UX details: `docs/blog-visual-editorial-spec.md`

## 1) Goal
Build a premium blog experience that:
- Expands organic visibility for Siargao-related search terms.
- Builds trust by publishing practical, high-value local guides.
- Feeds qualified readers into service pages naturally, without hard selling.
- Feels mobile-first, professional, and visually consistent with the current site theme.

## 2) What We Are Building
### Core deliverables
- A new blog preview section on the landing page.
- A dedicated blog index page at `/blog`.
- Dedicated blog post pages at `/blog/[slug]`.
- A reusable content model for short, practical editorial posts.
- Structured metadata, schema, sitemap, and internal links for SEO and AI search discoverability.

### Primary outcome
Capture more top-of-funnel and mid-funnel search demand around:
- Getting around Siargao.
- Places to visit.
- Restaurants and cafes.
- Itineraries and planning tips.
- Travel logistics and first-timer guidance.

## 3) Product and UX Principles
### Editorial tone
- Helpful first, sales second.
- Personal and local, like talking to a traveler 1:1.
- Clear, concise, and practical.
- Exciting and value-driven without hype or fluff.

### Reading style
- Short sections and short paragraphs.
- Strong subheads with direct answers.
- Scannable lists and quick tips.
- High whitespace density for easy reading on mobile.

### Trust and brand feel
- Preserve existing visual language: slate neutrals, emerald accents, rounded surfaces, restrained motion.
- Keep the premium feel through spacing, typography rhythm, and careful hierarchy.
- Avoid clickbait headlines and aggressive CTAs.

## 4) Mobile-First Design System
### Mobile baseline (360-430px)
- One-column layout everywhere.
- Large tap targets (44px+).
- Hero image first, then title/meta, then "At a Glance" summary.
- Sticky progress indicator optional, but keep it subtle.
- Comfortable reading width and line-height.

### Tablet/Desktop enhancements (768px+ and 1024px+)
- Wider max content container with optional right rail on desktop.
- Right rail can include a table of contents, related guides, and a soft CTA to service pages.
- Keep line length controlled for readability (do not stretch paragraphs too wide).

### Spacing and readability targets
- Section spacing: generous vertical rhythm (at least 48-72px between major blocks).
- Body copy: easy-to-read size and contrast.
- Keep visual noise low to highlight useful content.

## 5) Visual and Motion Direction
### Motion style
- Modern but subtle entrance effects.
- Slow fade-in with slight upward movement while scrolling.
- Stagger cards in small increments for polish.
- Motion only once per section to avoid distraction.

### Implementation approach
- Reuse existing `Reveal` pattern (`opacity + y` transition).
- Increase consistency with shared motion presets for section reveal, card reveal, and image reveal.
- Respect reduced motion preferences fully.

## 6) Information Architecture and URLs
- `/blog` = index page with featured + latest guides.
- `/blog/[slug]` = detail page for each guide.
- Optional future expansion: `/blog/category/[category]` and `/blog/tag/[tag]`.

### Homepage integration
Add a "Siargao Guides and Tips" section to landing page:
- 3 featured posts.
- 1 line value proposition.
- "View all guides" link to `/blog`.

## 7) Content Model (Short, Practical, Replaceable Assets)
Each post should include:
- `title`
- `slug`
- `excerpt`
- `publishedAt`
- `updatedAt`
- `author`
- `category`
- `tags`
- `readingTime`
- `heroImage`
- `content`
- `atAGlance` (3 to 5 bullet quick summary)
- `seo` (`title`, `description`)

### Placeholder image convention
Use placeholder files first, then replace later:
- `/public/blog/placeholders/{slug}-hero.jpg`
- `/public/blog/placeholders/{slug}-inline-1.jpg`
- `/public/blog/placeholders/{slug}-inline-2.jpg`

Recommended alt placeholder format:
- `PLACEHOLDER: replace with real photo of [location/topic] in Siargao`

## 8) Post Structure Template (Concise and Valuable)
Target length: 600 to 1,000 words.

Suggested structure:
1. Hook paragraph with immediate context.
2. "At a Glance" block (quick answer and key tips).
3. Main advice sections with practical details.
4. Local insight section ("What travelers usually miss").
5. Quick logistics section (time, budget, route notes).
6. Soft "Need transport?" CTA block only if relevant.
7. Related guides links.

Writing rules:
- Speak directly to the reader ("you").
- Keep advice actionable.
- Avoid keyword stuffing.
- Avoid turning posts into sales pages.

## 9) SEO + AI Search Optimization
### On-page SEO
- Unique metadata for `/blog` and every `/blog/[slug]`.
- One clear H1 per post.
- Clean heading structure (`H2/H3`) around user intent.
- Canonical URLs set per post.
- Strong internal links to related posts and money pages.

### Structured data
- Add `BlogPosting` JSON-LD per article.
- Include `headline`, `description`, `author`, `datePublished`, `dateModified`, `image`, `mainEntityOfPage`.
- Keep schema strictly aligned with visible page content.

### Sitemap and indexing
- Include all blog URLs in `sitemap.ts`.
- Keep `robots.ts` permissive for crawl.
- Ensure all blog pages are linked from at least one crawlable page.

### AI search readiness
- Front-load direct answers in first sections.
- Use explicit, factual language and concrete tips.
- Keep "At a Glance" and FAQ-like blocks concise and machine-readable.
- Use internal links that explain relationships between topics clearly.

## 10) Component and Route Plan (Current Codebase)
### New routes
- `src/app/blog/page.tsx`
- `src/app/blog/[slug]/page.tsx`

### New content/source files
- `src/lib/blog.ts` for post data and helpers.
- Optional `src/components/blog/*` for reusable article UI.

### Existing files to update
- `src/components/navigation/nav-links.ts` add `Blog`.
- `src/components/landing/landing-page.tsx` add blog preview section.
- `src/app/sitemap.ts` include blog index and post URLs.

## 11) Conversion Without Hard Selling
### CTA rules
- Keep CTA language soft and contextual.
- Use helpful phrasing such as "Need help with transport for this plan?" and "Check private transfer options".
- Avoid interruptive or repeated sales blocks.

### Placement
- 1 CTA near the end of post.
- Optional inline CTA only when directly relevant to topic.

## 12) Initial Editorial Calendar (First 8 Weeks)
Publishing cadence:
- Weeks 1-4: 2 posts per week.
- Weeks 5-8: 1-2 posts per week based on quality.

Starter topics:
1. How to get around Siargao (complete local guide).
2. IAO airport transfer tips for first-time visitors.
3. 3-day Siargao itinerary without renting a motorbike.
4. Best areas to stay in Siargao and how to move around.
5. Top local food spots in General Luna by budget.
6. Family-friendly Siargao day plans and route timing.
7. Siargao rainy season travel tips.
8. Most common Siargao transport mistakes and fixes.

## 13) Implementation Phases
### Phase 1: Foundation
- Create blog routes and shared blog data model.
- Build `/blog` and `/blog/[slug]` layouts with mobile-first design.
- Add nav links and landing page blog preview section.

### Phase 2: SEO + Schema
- Add per-page metadata and canonical.
- Add `BlogPosting` schema.
- Add blog URLs to sitemap.

### Phase 3: Content and polish
- Publish first 4-6 posts with placeholder images.
- Apply subtle scroll reveal animations.
- Tune whitespace, typography, and desktop layout.

### Phase 4: Measurement and iteration
- Track blog entry page performance in Search Console.
- Track internal CTA clicks to service pages.
- Refresh winning posts every 60-90 days.

## 14) QA Checklist
- [ ] Blog index and post pages render cleanly on mobile and desktop.
- [ ] New section on homepage matches current site theme.
- [ ] Readability is strong (spacing, contrast, paragraph length).
- [ ] Motion is subtle, smooth, and disabled for reduced-motion users.
- [ ] Metadata, canonical, and schema validate correctly.
- [ ] Blog URLs appear in sitemap.
- [ ] Placeholder images are present and easy to swap.
- [ ] Copy tone is helpful, personal, and not sales-heavy.

## 15) Definition of Done
- Blog section is visible on landing page and links to `/blog`.
- `/blog` and `/blog/[slug]` are live with polished responsive layouts.
- At least 4 high-quality short posts are published with placeholder images.
- SEO and AI-search foundations are fully in place.
- Blog supports organic discovery while maintaining premium brand trust.
