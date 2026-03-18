# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SEO-optimized marketing site for a private van hire business in Siargao, Philippines. Covers airport transfers and land tours. Built with Next.js App Router, fully static (no backend), content-first with strong structured data for SEO.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run lint     # Run ESLint (Next.js core-web-vitals + TypeScript)
npm run build    # Production build — catches compile and route errors
npm run start    # Run production build locally
```

**Quality gate before any PR**: `npm run lint` and `npm run build` must both pass. There is no test runner configured yet.

## Architecture

### Route Structure (`src/app/`)
Each service has its own route folder:
- `/` → landing page with FAQ, quote form, services overview
- `/private-van-hire-siargao`, `/airport-transfer-siargao`, `/land-tours-siargao` → individual service pages
- `/blog` → blog index; `/blog/[slug]` → dynamic blog post pages

### Data Layer (all static, no database)
- **Blog posts**: `src/lib/blog.ts` — hard-coded `blogPosts` array with full content, metadata, and SEO fields. Utilities: `getAllBlogPosts()`, `getBlogPostBySlug()`, `getLatestBlogPosts()`, `getRelatedBlogPosts()`.
- **Landing content**: `src/components/landing/landing-data.ts` — FAQ items, service highlights, and other landing page copy.
- **Service page content**: inline in each service page component.
- Supabase is referenced in `next.config.ts` for image CDN hostnames but not used for data.

### SEO Infrastructure
- `src/lib/schema.ts` — JSON-LD schema builders (LocalBusiness, Service, FAQ, BlogPosting, BreadcrumbList). Every page injects structured data.
- `src/lib/seo.ts` — `getSiteUrl()` reads `NEXT_PUBLIC_SITE_URL` (defaults to `https://siargao-rides.com`).
- `src/app/sitemap.ts` — auto-generated sitemap.
- Every route exports a `generateMetadata` function with canonical URLs, Open Graph, and Twitter tags.

### Component Patterns
- **Server components by default** — pages and layouts are server components.
- **`"use client"` only** for interactivity: quote form, FAQ accordion, scroll-triggered animations.
- **Reveal animations**: `src/components/ui/next-reveal.tsx` and `src/components/landing/reveal.tsx` wrap Framer Motion for scroll-triggered entry effects.
- **Shared UI primitives**: `src/components/ui/` (Button, Input, Select, Label, Separator) — Tailwind + CVA variants, Radix UI primitives underneath.
- **Service page template**: `src/components/service-pages/service-page-template.tsx` is the reusable layout used by all three service pages.

### Styling
Tailwind CSS v4 (configured via `@tailwindcss/postcss`). Use `className` with Tailwind utilities; use `cn()` from `src/lib/utils.ts` for conditional classes. No CSS modules or global styles beyond `src/app/globals.css`.

## Conventions

- Import alias: `@/*` maps to `src/*`
- File names: kebab-case; exported components/types: PascalCase
- Commit style: Conventional Commits — `feat(scope): ...`, `fix(scope): ...`, `chore: ...`
- Update `docs/` when changing page architecture or behavior

## External Research Tools

When library docs or current ecosystem info is needed:
- **Context7 MCP** — official library/framework documentation
- **Web search / Exa MCP** — recent facts and ecosystem changes
