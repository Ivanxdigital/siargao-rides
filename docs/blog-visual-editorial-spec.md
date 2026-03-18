# Blog Visual Editorial Spec

## Purpose
Define the visual and UX system for the blog so it feels:
- Premium and trustworthy.
- Modern but minimal.
- Editorial like a creative agency journal.
- Consistent with current Siargao Rides brand language.

This spec is the visual companion to:
- `docs/blog-section-editorial-seo-ai-search-plan.md`

## Design Direction
### Experience keywords
- Calm
- Refined
- Human
- Practical
- Intentional

### Visual principles
- High whitespace and clear hierarchy over dense content blocks.
- Strong typography contrast (display vs body) without loud colors.
- Subtle polish through motion, not effects-heavy decoration.
- Content-first layout that makes reading effortless on mobile first.

## Theme Mapping (Match Existing Brand)
### Color system
- Base background: `white` / `slate-50` section bands.
- Primary text: `slate-900`.
- Secondary text: `slate-500` to `slate-600`.
- Borders: `slate-100`.
- Accent: `emerald-600` for links, small chips, and key states.

### Surface language
- Large rounded containers (`rounded-2xl` to `rounded-3xl`).
- Minimal shadow depth (`shadow-sm` or very soft custom shadow only).
- Soft border emphasis over heavy shadow emphasis.

## Typography Spec
### Font stack
- Keep `Geist` for body and UI.
- Add one editorial serif for blog headlines only: `Newsreader` (recommended) or `Instrument Serif`.

### Usage model
- Display serif: page title, featured post title, article H1.
- Sans: metadata, navigation, body copy, UI labels.

### Type rhythm
- Article H1: large and tight (`text-4xl` mobile, `text-6xl` desktop).
- Deck/intro: readable and muted (`text-lg` to `text-xl`).
- Body: `text-base` mobile, `text-[17px]` desktop with generous leading.
- H2/H3: clear hierarchy with extra top spacing.

## Layout Blueprint
### 1) Blog Index (`/blog`)
### Section order
1. Intro hero band: title, short editorial statement, small category chips.
2. Featured story block: one dominant article card.
3. Latest guides grid: 2-column on desktop, 1-column on mobile.
4. Topic strips: "Getting Around", "Places", "Food", "Itineraries".
5. Final soft CTA to core service pages.

### Grid behavior
- Mobile: one-column stack with strong vertical spacing.
- Tablet: featured + secondary stack.
- Desktop: 12-column grid with featured spanning 7-8 columns.

### 2) Article Detail (`/blog/[slug]`)
### Section order
1. Breadcrumb + category.
2. Headline + deck + byline row.
3. Hero image.
4. "At a Glance" summary panel.
5. Main content column.
6. Inline image + caption modules.
7. Pull quote/key takeaway blocks.
8. Related guides + one soft contextual CTA.

### Reading width
- Main article line length should remain controlled at `max-w-[70ch]` equivalent for body content.
- Optional desktop right rail for TOC and related links.

## Component Specs
### Blog Card
- Image ratio: `4:3` standard, `16:9` featured.
- Metadata row: category, date, read time.
- Title: bold, short, high-contrast.
- Excerpt: 2-3 lines max.
- Hover: tiny image scale and arrow shift only on desktop.

### Category Chip
- Neutral chip style by default.
- Accent only for active state.
- Keep pills small, no bright badges.

### At a Glance Panel
- Light `slate-50` panel with border and rounded corners.
- 3-5 quick bullets.
- Positioned near top of article for fast value extraction.

### Pull Quote
- Slightly larger text, left border accent in emerald.
- Use sparingly (max 1-2 per long article).

### Image Blocks (Placeholders First)
- Hero: `/public/blog/placeholders/{slug}-hero.jpg`
- Inline: `/public/blog/placeholders/{slug}-inline-1.jpg`
- Optional second inline: `/public/blog/placeholders/{slug}-inline-2.jpg`
- Caption style: small muted text under image.

### Spacing System
- Major sections: `py-16` mobile, `py-24` desktop.
- Content block gaps: `gap-8` to `gap-12`.
- Paragraph spacing: clear separation, no wall-of-text blocks.
- Keep generous negative space around titles and media.

## Motion and Interaction
### Motion style
- Slow fade-in + slight upward translate.
- Stagger cards and section children subtly.
- No flashy transforms or parallax.

### Motion presets
- Section reveal: `duration 0.75-0.9s`, `y: 12-16`.
- Card stagger: `60-100ms`.
- Hover transition: `180-240ms`.

### Accessibility
- Respect `prefers-reduced-motion`.
- Motion only supports hierarchy; content remains fully usable without animation.

## Mobile-First Responsiveness
### 360-430px
- Single-column layout.
- Comfortable margins/padding.
- Readability first, no cramped side-by-side blocks.

### 768px
- Intro and cards gain horizontal structure.
- Maintain generous spacing; avoid dense tablet compression.

### 1024px+
- Introduce optional right rail on article pages.
- Use wider composition while preserving body reading width.

## Copy Presentation Rules
- Speak directly to the reader, not at them.
- Value-first and personal; avoid hard-sell voice.
- Keep intros short and useful.
- Use practical section labels ("If you only have half a day", "What travelers miss").
- End with helpful next steps, then optional service link.

## Implementation Mapping
### New UI components (recommended)
- `src/components/blog/blog-index-hero.tsx`
- `src/components/blog/featured-post-card.tsx`
- `src/components/blog/blog-post-card.tsx`
- `src/components/blog/article-header.tsx`
- `src/components/blog/article-body.tsx`
- `src/components/blog/article-toc.tsx`
- `src/components/blog/at-a-glance.tsx`
- `src/components/blog/related-guides.tsx`

### Existing reusable pieces
- Reuse `Reveal` animation wrapper.
- Reuse `SiteNavbar` and global container rhythm from existing pages.

## Quality Bar (Definition of Visual Done)
- Blog index looks intentional and premium at 360, 390, 768, 1024, 1440 widths.
- Article pages feel editorial with clear hierarchy and high readability.
- Motion is subtle and cohesive with existing site behavior.
- Blog matches current brand palette and trust-focused tone.
- No section feels crowded or generic.
