# Repository Guidelines

## Project Overview
Siargao Rides is a Next.js (App Router) web app. Current product direction is **premium, private-only** van hire and tours with a **WhatsApp-first** conversion flow (no booking forms, no shared/joiner tours).

## Project Structure & Module Organization
- `src/app/`: App Router routes (`**/page.tsx`, layouts, and `src/app/api/**/route.ts` handlers).
- `src/components/`: reusable UI/components (`layout/` for `Navbar`/`Footer`, `ui/` for shadcn-style primitives).
- `src/lib/`: shared utilities, types, and integrations (e.g., Supabase helpers).
- `public/`: static assets (images, icons).
- `docs/`: product/spec docs and implementation plans (add new PRDs here).
- `scripts/`: operational scripts (e.g., DB resets, storage setup).

## Build, Test, and Development Commands
- `npm run dev`: run Next.js locally.
- `npm run build`: production build (use before PRs when possible).
- `npm run start`: run the production build locally.
- `npm run lint`: ESLint checks (required before merging).
- `npm run reset-db`: resets local DB state (use with care).
- `npm run setup-storage`: initializes storage (Supabase-related).

## Coding Style & Naming Conventions
- TypeScript + React (TSX). Follow existing patterns and keep diffs minimal.
- Indentation: 2 spaces. Prefer clear component/file names (`PascalCase.tsx`).
- Routes: use Next conventions (`src/app/<route>/page.tsx`).
- Keep the “premium/private” tone in copy and avoid “shared/joiner” wording.

## Testing Guidelines
- `vitest` is available for unit tests, but the repo may not have full coverage yet.
- Name tests `*.test.ts` / `*.test.tsx` near the code they cover.

## Commit & Pull Request Guidelines
- Prefer Conventional Commits when possible (`feat(scope): ...`, `fix(scope): ...`), matching existing history.
- PRs should include: a short summary, what changed, any relevant `docs/` updates, and screenshots/gifs for UI changes.

## Development Logs (Agent Instruction)
When making a **substantial change**, the agent must create or update a development log entry in `docs/devlog/`.

Create a log entry when you:
- do a massive refactor, introduce new architecture, or change core routing/layout
- add a new feature that affects user flows or backend/API behavior
- fix a major production issue, security issue, SEO/indexing issue, or data integrity problem

Log format (keep it short, but specific):
- File: `docs/devlog/YYYY-MM-DD-<short-title>.md`
- Include: context, what changed, key files/paths touched, any breaking changes, rollout/verification steps (e.g., `npm run build`, `npm run lint`), and follow-ups/todos.

## Security & Configuration Tips
- Never commit secrets. Use `.env.local` locally and keep `.env.local.example` updated with variable names only.
