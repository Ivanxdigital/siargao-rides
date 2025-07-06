# CLAUDE.md – Coding & Onboarding Rules for **Siargao Rides**

> Claude Code reads this file at the start of every session. **Follow every rule unless the user explicitly overrides it.** These rules exist to keep the codebase clean, safe, and fast to iterate on.

---

## 1 · Quick Dev Commands

| Script                  | Purpose                                                           |
| ----------------------- | ----------------------------------------------------------------- |
| `npm run dev`           | Start dev server – [http://localhost:3000](http://localhost:3000) |
| `npm run build`         | Build for production                                              |
| `npm run start`         | Run built app                                                     |
| `npm run lint`          | ESLint + Type‑check                                               |
| `npm run test`          | Vitest unit tests                                                 |
| `npm run reset-db`      | Reset local DB via `scripts/reset-db.js`                          |
| `npm run setup-storage` | Create Supabase storage buckets                                   |

---

## 2 · Tech Stack at a Glance

| Layer             | Tooling / Service                       | Must‑Know Constraints                                                                                       |
| ----------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Framework**     | Next.js 15 (App Router)                 | – **Server Components** by default.<br>– Client Components only when you need state, refs, or browser APIs. |
| **Language**      | TypeScript (strict)                     | `noImplicitAny` + `strictNullChecks` must pass.                                                             |
| **Styling**       | Tailwind CSS + dark/minimal theme       | Use utility classes; no inline styles.                                                                      |
| **UI Primitives** | shadcn/ui + Radix                       | Import from `@/components/ui/*`; never fork core primitives.                                                |
| **Animation**     | Framer Motion                           | Keep motion props in `motionConfig` objects; don't animate above‑the‑fold layout.                           |
| **State/Data**    | React‑Query (`@tanstack/react-query`)   | Wrap queries in the **service layer**; no `.useQuery()` calls in pages.                                     |
| **Backend**       | Supabase (Postgres, Auth, Storage, RLS) | All queries live in `src/lib/api.ts`; no direct clients in components.                                      |
| **Validation**    | Zod                                     | Parse **all** external input (forms, URL params, cookies).                                                  |
| **Testing**       | Vitest + MSW                            | New utils/components need ≥1 test with MSW for network mocks.                                               |

---

## 3 · Repository Layout

```
src/
├─ app/                # Next.js pages & API routes (App Router)
│  ├─ api/             # Backend API endpoints
│  ├─ booking/         # Booking flow pages
│  ├─ dashboard/       # Role‑based dashboards
│  └─ …
├─ components/         # Reusable UI
│  ├─ ui/              # shadcn/ui primitives
│  ├─ layout/          # Navbar, Footer, etc.
│  └─ shop/            # Feature‑specific comps
├─ lib/                # Core utilities & services
│  ├─ api.ts           # Supabase queries
│  ├─ service.ts       # Business logic wrapper
│  ├─ supabase.ts      # Supabase client
│  ├─ types.ts         # Shared TS types
│  └─ …
├─ contexts/           # React Context providers
└─ supabase/           # SQL migrations, policies, functions
```

### Folder Rules

1. **Pages** go in `src/app/` and must export `generateMetadata` unless SEO is irrelevant.
2. **Generic components** live in `src/components/ui/`; **feature components** get their own sub‑folder.
3. **Business logic only** in `src/lib/service.ts` or a new file under `lib/` – never in pages.
4. Adding a Supabase table → migration SQL + regenerated `database.types.ts`.
5. Context providers live in `src/contexts/` (one provider per file).

---

## 4 · Development Guidelines

### 4.1 TypeScript

* Never use `any`; use proper generics or utility types.
* No `as unknown as` hacks – fix the types.
* Export common interfaces from `src/lib/types.ts`.

### 4.2 React / Next.js

* Server Components: **no** state or `useEffect`.
* Client Components: suffix file name with `-client.tsx`.
* Wrap async functions in `try/catch` and return typed errors.

### 4.3 TailwindCSS

* Class order: **layout → spacing → typography → color → state**.
* Use `@apply` only for complex selectors in `*.module.css`.

### 4.4 Performance & UX

* Use `next/image` for **all** images.
* Fetch **≤50 rows** per query; paginate otherwise.
* Provide skeletons for content that loads > 300 ms.

### 4.5 Error Handling

| Scenario       | What to Render                                                                  |
| -------------- | ------------------------------------------------------------------------------- |
| Network error  | `toast.error("Something went wrong. Please try again.")` and `console.error(e)` |
| Zod form error | Field‑level messages, no generic alerts                                         |
| 401 / Unauth   | `redirect('/login')` in server component                                        |

### 4.6 Testing & Quality

* `npm run lint` & `npm run test` must pass pre‑commit.
* 100% of new public functions need unit tests.
* Mock Supabase with MSW; never hit prod DB in tests.

---

## 5 · Database & Schema

| Table          | Purpose                                | Notes                                         |
| -------------- | -------------------------------------- | --------------------------------------------- |
| `users`        | Auth & profiles                        | Multi‑role (`tourist`, `shop_owner`, `admin`) |
| `rental_shops` | Shop info & verification               | FK → `users(id)`                              |
| `vehicles`     | Inventory (motorcycles, cars, tuktuks) | Replaces legacy `bikes`                       |
| `rentals`      | Booking records                        | Status & payment state                        |
| `reviews`      | Ratings & comments                     | Nullable FK for anonymous reviews             |
| `referrals`    | Shop acquisition tracking              | Self‑ref user FK                              |

**Schema Change Workflow**

1. Write raw SQL migration → commit to `supabase/migrations/yyyymmdd_<slug>.sql`.
2. Run locally with Supabase CLI or SQL Editor.
3. Regenerate types: `supabase gen types typescript --linked > src/lib/database.types.ts`.
4. Update `src/lib/types.ts` and docs if needed.

---

## 6 · Security & Compliance

* RLS enabled on **all** tables.
* Validate every user input with Zod.
* Secrets only in `.env*`; never commit keys.
* HTTPS enforced in production.
* Supabase Service Key used **only** in secure server contexts (API routes, edge functions).

---

## 7 · Environment Variables (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_USE_MOCK_DATA=false

NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=
RESEND_API_KEY=

PAYMONGO_SECRET_KEY=
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=
NEXT_PUBLIC_PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
PAYPAL_ENVIRONMENT=sandbox

SEMAPHORE_API_KEY=
SEMAPHORE_SENDER_NAME="SEMAPHORE"
```

Use `NEXT_PUBLIC_FEATURE_*` flags for feature toggles (e.g. `NEXT_PUBLIC_FEATURE_ONBOARDING_V2`).

---

## 8 · Pull‑Request Checklist

* [ ] `npm run lint` & `npm run test` pass
* [ ] ESLint shows **no new warnings** in browser console
* [ ] Unit tests cover new logic (≥90 % lines)
* [ ] SQL migration + regenerated types (if DB change)
* [ ] Storybook story added/updated (if UI change)
* [ ] Docs updated (CLAUDE.md, README, or `/docs/shop-owner-onboarding-flow-complete.md` for onboarding changes)
* [ ] PR title follows **Conventional Commits** (e.g. `feat(bookings): add recurring rentals`)

---

## 9 · Common Pitfalls

1. Calling Supabase directly from components → always via **service layer**.
2. Mixing server & client logic in one file.
3. Over‑fetching data (select only needed columns).
4. Missing skeleton or error states.
5. Forgetting dark‑theme contrast ratios → run Lighthouse A11y.

---

## 10 · AI Prompting Guidelines

* **Explain first, code second** – 1‑2 sentence rationale above code blocks.
* Reference exact paths ("In `src/components/VehicleCard.tsx` …").
* Output **compilable** TypeScript; no pseudo‑code.
* Use multi‑file diff format for >1 file.
* Ask clarifying questions before large changes.
* End messages with `✅ Ready for review`.

---

## 11 · Current Roadmap (Q3 2025)

* Van‑hire feature & custom booking flow
* PayPal integration & webhook handling
* Vehicle verification workflow (admin → shop owner)
* Shop verification workflow completion (shop owner document upload)
* SEO deep‑dive for van‑hire landing pages

---

### 🏝  Welcome to Siargao Rides — let's ship clean, accessible code fast!


## 12 · Key Documentation References

* **Shop Owner Onboarding System**: See `/docs/shop-owner-onboarding-flow-complete.md` for comprehensive analysis of current implementation, critical gaps, and recommendations.

---

## 13 · MCP Server Usage Guidelines

The project has four MCP servers installed that provide powerful capabilities for development, research, and debugging. **Use these tools strategically** to enhance development workflow while avoiding unnecessary API costs.

### 13.1 Supabase MCP Server

**Purpose**: Direct integration with Supabase cloud platform for database management and project operations.

**When to Use**:
- Database schema changes and migrations
- Creating/managing Supabase projects and branches  
- Executing SQL queries for data analysis
- Generating TypeScript types after schema changes
- Managing project settings and configurations
- Monitoring database performance and advisors

**Key Capabilities**:
- `list_projects` / `get_project` - Project discovery and details
- `create_project` / `create_branch` - Development environment setup
- `apply_migration` / `execute_sql` - Database operations
- `list_tables` / `generate_typescript_types` - Schema management
- `get_advisors` - Security and performance recommendations

**Best Practices**:
- Always use read-only mode by default to prevent accidental changes
- Validate SQL queries in staging before applying to production
- Run `get_advisors` after schema changes to catch security issues
- Use branches for testing major database changes
- Regenerate TypeScript types after any schema modifications

**Example Usage**:
```
Check our Supabase project status and run security advisors
Create a new development branch for testing rental flow changes
Generate updated TypeScript types after adding vehicle categories table
```

### 13.2 Context7 MCP Server

**Purpose**: Fetch up-to-date, version-specific documentation and code examples for any library or framework.

**When to Use**:
- Need current API documentation for installed packages
- Looking for implementation examples and best practices
- Troubleshooting with the latest library documentation
- Learning new features in framework updates
- Ensuring code uses non-deprecated APIs

**Key Capabilities**:
- `resolve-library-id` - Find Context7-compatible library identifiers
- `get-library-docs` - Fetch documentation with topic filtering and token limits

**Best Practices**:
- Add "use context7" to prompts when seeking library-specific help
- Use specific library IDs when known (e.g., `/vercel/next.js`)
- Filter by topic to focus on relevant documentation sections
- Adjust token limits based on complexity of your question

**Example Usage**:
```
How do I implement middleware for authentication in Next.js 15? use context7
Show me Supabase RLS policy examples for multi-tenant apps. use context7
What's the proper way to handle form validation with Zod? use context7
```

### 13.3 Firecrawl MCP Server  

**Purpose**: Advanced web scraping, crawling, and content extraction for research and competitive analysis.

**When to Use**:
- Researching competitor rental pricing and features
- Analyzing tourism websites for market insights
- Extracting structured data from travel platforms
- Gathering content for SEO research
- Monitoring industry trends and news

**Key Capabilities**:
- `firecrawl_scrape` - Single page content extraction
- `firecrawl_search` - Web search with content extraction
- `firecrawl_crawl` - Multi-page website crawling
- `firecrawl_extract` - Structured data extraction with AI
- `firecrawl_deep_research` - Comprehensive research on topics

**Best Practices**:
- Use batch operations for multiple URLs to respect rate limits
- Leverage `onlyMainContent` to avoid navigation and footer noise  
- Set appropriate `maxUrls` and `timeLimit` for deep research
- Use structured extraction with schemas for consistent data
- Cache results locally to avoid repeated API calls

**Example Usage**:
```
Research competitor motorcycle rental pricing in Siargao
Extract vehicle inventory data from competing rental websites  
Find tourism trend articles about Siargao island travel
Analyze competitor booking flow UX patterns
```

### 13.4 Browser Tools MCP Server

**Purpose**: Monitor and interact with browser for debugging, performance optimization, and accessibility auditing.

**When to Use**:
- Frontend debugging and error diagnosis
- Performance optimization and Core Web Vitals analysis
- Accessibility compliance testing (WCAG)
- SEO auditing and meta tag analysis
- Network request monitoring and API debugging
- User experience testing and screenshot capture

**Key Capabilities**:
- `getConsoleLogs` / `getConsoleErrors` - Debug JavaScript issues
- `getNetworkLogs` / `getNetworkErrors` - Monitor API calls
- `takeScreenshot` - Visual testing and documentation
- `runAccessibilityAudit` - WCAG compliance checking
- `runPerformanceAudit` - Lighthouse performance analysis
- `runSEOAudit` - Search engine optimization analysis
- `runNextJSAudit` - Framework-specific best practices
- `runAuditMode` - Comprehensive audit suite

**Prerequisites**:
- Install BrowserTools Chrome extension
- Run `npx @agentdeskai/browser-tools-server@latest` in terminal
- Configure MCP server in IDE
- Open Chrome DevTools to BrowserTools panel

**Best Practices**:
- Use audit modes for comprehensive analysis
- Run accessibility audits before production deployment
- Monitor network logs during booking flow testing
- Capture screenshots for visual regression testing
- Use debugger mode for systematic issue diagnosis

**Example Usage**:
```
Run accessibility audit on the vehicle booking page
Check Core Web Vitals performance on the homepage  
Debug network errors during payment processing
Audit SEO compliance for rental shop listing pages
Take screenshots of mobile booking flow
```

### 13.5 Integration with Siargao Rides Development

**Project-Specific Use Cases**:

1. **Database Development**: Use Supabase MCP for schema migrations, RLS policy testing, and generating types after adding vehicle categories or rental features.

2. **Framework Implementation**: Use Context7 when implementing Next.js 15 features, PayPal integration, or Supabase authentication patterns.

3. **Market Research**: Use Firecrawl to analyze competitor rental platforms, pricing strategies, and feature offerings in the tourism industry.

4. **Quality Assurance**: Use Browser Tools to ensure accessibility compliance, optimal performance, and proper SEO for van-hire landing pages.

**Workflow Integration**:
- Include MCP server checks in pull request workflows
- Use audit tools before production deployments  
- Leverage research tools for feature planning
- Integrate documentation lookup into code review process

### 13.6 Cost Management and Efficiency

**CRITICAL: When NOT to Use MCP Servers**

❌ **Don't use MCP servers for**:
- Basic coding questions you can answer directly
- Simple explanations or tutorials
- Well-known patterns and implementations
- General programming concepts
- Tasks that don't require external data

✅ **Use MCP servers when**:
- You need current/specific documentation
- Researching competitors or market data
- Debugging complex frontend issues
- Making database schema changes
- Ensuring compliance or performance standards

**Token Management**:
- Context7: Use focused topics and appropriate token limits
- Firecrawl: Cache results, use batch operations efficiently
- Browser Tools: Run audits selectively, not on every change
- Supabase: Group related operations together

**Rate Limiting Awareness**:
- All MCP servers have rate limits and costs
- Batch operations when possible
- Cache results locally when appropriate
- Don't repeat identical queries within the same session