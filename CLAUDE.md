# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (run both simultaneously)
npm run dev          # Vite frontend
npm run convex:dev   # Convex backend

# Quality
npm run lint         # ESLint
npm run test         # Vitest (single run)
npm run test:coverage

# Build
npm run build        # tsc + vite build
```

Run a single test file: `npx vitest run src/path/to/file.test.tsx`

## Architecture

**Stack:** React 19 + TypeScript + Vite, Convex serverless backend, Chakra UI v3, wouter routing, Convex Auth.

**Data flow:** Components subscribe to data with `useQuery()` / `usePaginatedQuery()` from `convex/react`. Convex handles real-time sync automatically — no manual cache invalidation needed. Writes go through `useMutation()`. State lives in Convex + React `useState`; no Redux/Zustand.

**Authentication:** Managed by Convex Auth. `App.tsx` wraps routes in `<Authenticated>`, `<Unauthenticated>`, `<AuthLoading>`. On the backend, always use `getAuthUserId(ctx)` — never trust `args.userId`.

**Backend (`convex/`):**
- `schema.ts` — table definitions (users, expenses, expensesFiles, bankAccounts, bankAccountCards)
- `expenses.ts` — main expense CRUD and aggregation queries
- `expensesfiles.ts` — file attachments via Convex storage
- `users.ts` — `viewer` query returning the current authenticated user
- `auth.ts` / `auth.config.ts` — Convex Auth setup

**Frontend (`src/`):**
- `features/<Feature>/` — pages, components, modals, hooks scoped to one feature
- `shared/` — reusable components, hooks, and utils used across features
- `components/ui/` — low-level Chakra UI primitives/wrappers
- `App.tsx` — routing via `wouter` (`/`, `/dashboard`, `/expenses`, `/about`)

**Path aliases:** `@/` → `src/`, `~/` → `convex/`

## Rules

Detailed coding standards live in `.claude/rules/`:

- [`convex-standards.md`](.claude/rules/convex-standards.md) — arg validation, auth, error handling, pagination, reactivity
- [`frontend-standards.md`](.claude/rules/frontend-standards.md) — component structure, Chakra UI, animations, data fetching, CRUD patterns
- [`dev-workflow.md`](.claude/rules/dev-workflow.md) — running servers, checks to run, single test commands
