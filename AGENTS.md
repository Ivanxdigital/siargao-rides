# Repository Guidelines

## Project Structure & Module Organization
This is a Next.js App Router project. Main code lives in `src/`:
- `src/app/`: route entry points (`page.tsx`, `layout.tsx`, route folders like `airport-transfer-siargao/`).
- `src/components/`: UI and feature components (`landing/`, `navigation/`, `service-pages/`, `ui/`).
- `src/lib/`: shared helpers (SEO, schema, utility functions).
- `public/`: static assets (logos, images, icons).
- `docs/`: implementation specs and dev logs. Update docs when behavior or page architecture changes.

Use the `@/*` import alias for `src/*` paths.

## Build, Test, and Development Commands
- `npm run dev`: start local dev server at `http://localhost:3000`.
- `npm run lint`: run ESLint (Next.js core-web-vitals + TypeScript rules).
- `npm run build`: create a production build and catch compile/runtime route issues.
- `npm run start`: run the production build locally.

Before opening a PR, run `npm run lint` and `npm run build`.

## Coding Style & Naming Conventions
- Language: TypeScript + React function components.
- Indentation: 2 spaces; keep lines readable and prefer small, focused components.
- Files:
  - route folders use kebab-case (for example, `private-van-hire-siargao`),
  - component files use kebab-case,
  - exported component/type names use PascalCase.
- Prefer server components; add `"use client"` only when interactivity is required.
- Styling is Tailwind-first in `className`; use shared primitives in `src/components/ui`.

## Testing Guidelines
There is no dedicated test runner configured yet. Current quality gate is:
1. `npm run lint`
2. `npm run build`

When adding tests, colocate them as `*.test.ts(x)` near the feature or under `src/__tests__/`, and prioritize critical user flows (navigation, quote form behavior, SEO metadata).

## Commit & Pull Request Guidelines
Recent history favors Conventional Commit style:
- `feat(scope): ...`
- `fix(scope): ...`
- `chore: ...`

Keep commits focused and imperative (for example, `feat(landing): add FAQ accordion animation`).

PRs should include:
- clear summary and motivation,
- linked issue/task (if applicable),
- screenshots/GIFs for UI changes (desktop + mobile),
- confirmation that `npm run lint` and `npm run build` pass.

## Research & Documentation Tools
When local code or docs are not enough, use external tools to verify current information:
- Use the Exa MCP server for web research and up-to-date technical context.
- Use the web search tool when you need recent facts, announcements, or ecosystem changes.
- Use the Context7 MCP server to check official library/framework documentation and examples.

Prefer primary sources and cite links in PR notes when research affects implementation decisions.
