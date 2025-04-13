# Enhanced AI Coding Agent Rules: Siargao Rides Project

These rules combine general interaction guidelines and project-specific technical requirements for AI contributions to the `siargao-rides` codebase.

## A. General Interaction & Communication

* **Start Confirmation:** **Begin every response with the 🤖 emoji** to confirm you have read and followed these rules.
* **Clarity:** Explain concepts in **simple, beginner-friendly language**. Avoid jargon. Assume I **don’t know how something works unless stated otherwise**.
* **Incremental Steps:** Break down explanations and code into **small, digestible steps**.
* **Clarification:** Be proactive about **asking for clarification before writing long or complex code**.
* **Large Tasks:** If given a **large or complex task**, break it into **smaller chunks**. Work on the code **bit by bit** and ask for confirmation before moving to the next chunk.

## B. Code Generation & Quality

* **Quality Focus:** Prioritize **clean, readable, well-commented code**. Add comments to explain the *why*, not the *what*.
* **Modern Syntax:** Use modern JavaScript/TypeScript syntax (e.g., `async/await`, ES6+).
* **Structure:** Structure code into **clear components**, **hooks**, or **API helpers** where appropriate.
* **TypeScript:** Use TypeScript 5 exclusively. Enforce strong typing, define interfaces/types for data structures (props, API responses, DB schemas), and avoid `any`. Add type annotations and interfaces.
* **Readability:** Write clear, concise, and modular code.
* **Linting:** Strictly follow ESLint rules (`eslint-config-next`). Run `npm run lint` frequently and fix violations.
* **Builds:** Ensure code builds successfully (`npm run build`).
* **Debugging Logs:** Include helpful `console.log()` statements for debugging during development, especially when working with data. (Consider removing them before final commits or using a conditional logging approach).

## C. Project Stack & Conventions (Siargao Rides Specific)

* **Framework:** Adhere strictly to **Next.js 15+ App Router** conventions (Server Components, Client Components, file-based routing, API routes).
* **UI Library:** Utilize **React 18+** features, primarily hooks.
* **Component Primitives:** Build accessible custom components using **Radix UI primitives** (`@radix-ui/*`).
* **Styling:** Apply styling primarily with **Tailwind CSS** utility classes.
    * Use `tailwind-merge` and `clsx` for conditional/dynamic class generation.
    * Maintain consistency through `tailwind.config.js`.
* **UI/UX Principles:**
    * Prioritize a **modern, minimalistic, and visually appealing** user interface.
    * Ensure all UI components and layouts are **fully responsive** (mobile and desktop).
* **Icons:** Use **`lucide-react`** consistently for all icons.
* **Animation:** Use animations subtly via **`framer-motion`** or standard Tailwind animations. Be consistent.
* **Themes:** Implement and respect light/dark modes using **`next-themes`**.
* **Validation:** Define and use **Zod schemas (`zod`)** for *all* data validation (forms, API inputs/outputs, environment variables).
* **Library Consolidation (High Priority):**
    * **Date Libraries:** Standardize on **`date-fns`**. Refactor existing code and remove others (`moment`, redundant pickers/calendars like `react-big-calendar`, `react-calendar`, `react-datepicker`, `react-day-picker` unless a specific unique feature is absolutely required).
    * **Notification Libraries:** Choose **one** (`sonner` or `react-hot-toast`) and remove the other.
* **Utilities & Services:**
    * Use `uuid` for unique IDs.
    * Use `browser-image-compression` before image uploads.
    * Use `Resend` for emails.
    * Implement `react-google-recaptcha-v3` on relevant forms.
* **Custom Scripts:** Understand and correctly use `scripts/reset-db.js` and `scripts/setup-storage.js`.
* **Environment:** Manage environment variables using `.env` files and `dotenv`.
* **Large Projects:** If the project grows significantly (e.g., 1000+ files), **search and link to relevant files before modifying or debugging**.

## D. Supabase & Database Interaction

* **Client:** Use the **`@supabase/supabase-js`** client for data operations.
* **Authentication:** Implement authentication using **`@supabase/auth-helpers-nextjs`**.
* **Database Type:** Assume **PostgreSQL**.
* **Security:** Implement **Supabase Row Level Security (RLS)** for data access control.
* **MCP Server:** The Supabase MCP server is **read-only**.
* **Schema Changes:**
    * If any **schema changes**, **table creation**, or **modifications** are needed, **do not run any Supabase CLI commands or setup scripts**.
    * Instead, generate **raw SQL code** that I can copy-paste and run manually inside the Supabase SQL Editor.
    * Clearly explain **why** the change is needed and **what the SQL code does** in simple terms.
* **Database Context:** Whenever context from the Supabase database is needed (e.g., table structures, row data, relationships), **always use the Supabase MCP server to query live data**. Do not guess or assume.

## E. Debugging

* **Verification First:** Never assume the cause of an error — **verify with logs or queries first**.
* **MCP Usage:**
    * Use **Supabase MCP** to query live database context when needed for backend/data issues.
    * Use **browser MCP** to inspect console/network logs if a frontend issue is mentioned. **Do not use the screenshot tool** within the browser MCP.
* **Bug Explanation:** Summarize bugs clearly:
    * What the bug is
    * Why it's happening (based on verification)
    * How to fix it
    * Use plain, beginner-friendly English.

## F. Collaboration & Proactivity

* **Confirmation:** Always confirm what I want before making **big changes** or overwriting files.
* **Planning:** Summarize your plan before making multiple updates or tackling complex changes.
* **Suggestions:** Let me know if something seems off, could be improved, or should be refactored — even if I didn’t ask. Be proactive in suggesting better approaches or identifying potential issues.