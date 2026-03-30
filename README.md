# My Expenses

![Coverage](./coverage-badge.svg)

A personal expense tracker: record spending by month, explore dashboards with charts, attach files to expenses, and keep data scoped per user. The app is a **React + TypeScript** SPA backed by **Convex** (database, real-time queries, file storage, and authentication).

## Features

- **Authentication** — Sign-in via Convex Auth (`@convex-dev/auth`); routes are protected until the user is authenticated.
- **Expense list** — Paginated list with search, month navigation, sorting, and actions (create, edit, duplicate, remove, manage attachments).
- **Dashboard** — Month/year views and optional category filter; charts built with Chakra UI Charts / Recharts.
- **Attachments** — Files linked to expenses (`expensesFiles` + Convex storage).
- **Bank accounts (dev data)** — Optional seed mutations for sample bank accounts and cards.

## Tech stack

| Layer | Choice |
|-------|--------|
| UI | React 19, Chakra UI v3, Emotion |
| Routing | [wouter](https://github.com/molefrog/wouter) |
| Backend | [Convex](https://convex.dev/) (queries, mutations, actions, auth, storage) |
| Auth | `@convex-dev/auth` with `@auth/core` |
| Build | Vite 7, TypeScript |
| Tests | Vitest, Testing Library, jsdom; Playwright for E2E |

## Project layout

```
src/
  features/          # Feature screens (Auth, Dashboard, Expense, Home, About)
  shared/            # Shared layout, hooks, animation helpers, utilities
  components/ui/     # App-level UI primitives (e.g. toaster)
e2e/                 # Playwright E2E tests (see playwright.config.ts)
convex/              # Schema, auth, expenses, users, files, bank account helpers
```

The `@/` path alias maps to `src/*` (see `vite.config.ts` and `tsconfig.app.json`). Vite also defines a `~` alias to `./convex` for bundler resolution if you use it in imports.

## Routes

| Path | Page |
|------|------|
| `/` | Home |
| `/dashboard` | Dashboard (default period) |
| `/dashboard/month/:month/year/:year` | Dashboard for a month/year |
| `/dashboard/month/:month/year/:year/category/:category` | Same + category filter |
| `/expenses` | Expense list |
| `/about` | About |

Unauthenticated users see the sign-in screen instead of the main app shell.

## Prerequisites

- **Node.js** (LTS recommended)
- A **Convex** project (see [Convex quickstart](https://docs.convex.dev))

## Development

Install dependencies:

```bash
npm install
```

Run the Vite dev server and Convex in separate terminals (or use your IDE to run both):

```bash
npm run dev
```

```bash
npm run convex:dev
```

Use `npx convex dev` if you prefer invoking Convex directly. Configure your Convex deployment and environment (e.g. `CONVEX_SITE_URL` for auth) in the [Convex dashboard](https://dashboard.convex.dev) as required by `@convex-dev/auth`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (HMR) |
| `npm run build` | Typecheck (`tsc -b`) and production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (single run) |
| `npm run test:coverage` | Vitest with coverage |
| `npm run test:e2e` | Playwright E2E (`playwright test`) |
| `npm run test:e2e:ui` | Playwright with UI mode |
| `npm run test:e2e:headed` | Playwright with a visible browser |
| `npm run coverage:badge` | Regenerate `coverage-badge.svg` from coverage output |
| `npm run convex:dev` | Convex dev sync (`npx convex dev`) |

## Convex

- **Schema** — `convex/schema.ts`: tables for users, expenses, expense files, bank accounts, and cards (plus auth tables from `@convex-dev/auth`).
- **API** — Functions live under `convex/`; generated types are in `convex/_generated/`.
- **Local dev** — Do not deploy to production while iterating; use `convex dev` for local development.

### Seeding sample bank data

To populate the database with example bank accounts (development/testing):

```bash
npx convex run bankAccounts:createFakeBankAccounts
```

## Testing

### Vitest

Vitest is configured in `vite.config.ts` (use `vitest/config`’s `defineConfig` so the `test` block is typed). Coverage options target `src/**/*.{ts,tsx}` with common exclusions for `node_modules`, `dist`, and Convex.

### Playwright (E2E)

End-to-end tests live under `e2e/`. Configuration is in `playwright.config.ts` at the repo root ([Playwright docs](https://playwright.dev/docs/test-configuration)):

| Setting | Value |
|---------|--------|
| `testDir` | `./e2e` |
| `use.baseURL` | `http://localhost:5173` (matches Vite dev server) |
| `webServer` | Runs `npm run dev`, waits for `http://localhost:5173`; locally reuses an already-running dev server unless `CI` is set |
| Projects | Chromium (`Desktop Chrome`) |
| CI | `forbidOnly`, 2 retries, 1 worker, `github` reporter |

Set **`VITE_CONVEX_URL`** in `.env.local` (or your environment) when running E2E against the dev server so the app can reach your Convex deployment.

Run E2E tests with `npm run test:e2e` (or `npm run test:e2e:ui` / `npm run test:e2e:headed` for UI or headed mode). Install browser binaries once with `npx playwright install` if needed.

---

*Originally generated from the Vite + React + TS template; project-specific behavior is documented above.*
