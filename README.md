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

## Running the app

The app needs **two processes running at the same time**:

1. **Vite** (`npm run dev`) — serves the frontend at <http://localhost:5173>.
2. **Convex** (`npm run convex:dev`) — pushes everything in `convex/` (schema + functions) to your Convex **dev** deployment and keeps watching for changes.

If Convex is not running, the frontend loads but every query fails (e.g. `Could not find public function for 'expenses:...'`).

You can run both **with Docker** (no Node.js needed on your machine) or **locally with Node.js**. Pick one path below, then do the one-time [Convex Auth setup](#3-one-time-convex-auth-setup).

### Prerequisites

- A free [Convex account](https://dashboard.convex.dev)
- A [GitHub account](https://github.com) (sign-in uses GitHub OAuth)
- **Either** [Docker Desktop](https://www.docker.com/products/docker-desktop/) **or** Node.js 22 + npm

### 1. Option A — Docker (recommended)

1. Create your env file from the template:

   ```bash
   cp .env.docker.example .env.local
   ```

2. Fill in `.env.local`:
   - Create a project in the [Convex dashboard](https://dashboard.convex.dev) (or reuse an existing one).
   - Open the project's **Settings → URL & Deploy Key** for the **Development** deployment.
   - Copy the **Deployment URL** (`https://<name>.convex.cloud`) into `VITE_CONVEX_URL`.
   - Click **Generate Development Deploy Key** and paste it into `CONVEX_DEPLOY_KEY`.

   The deploy key lets `convex dev` run inside the container without a browser login. If you leave it empty, `convex dev` will ask you to log in through a URL on the first run; that login only lasts as long as the container.

3. Build and start the frontend container:

   ```bash
   docker compose up -d --build
   ```

4. In a **separate terminal**, start Convex inside the same container and leave it running:

   ```bash
   docker compose exec frontend npm run convex:dev
   ```

   Wait for `✔ Convex functions ready!`.

5. Do the [Convex Auth setup](#3-one-time-convex-auth-setup) (first time only), then open <http://localhost:5173>.

Useful Docker commands:

| Command | What it does |
|---------|--------------|
| `docker compose logs -f frontend` | Follow Vite logs |
| `docker compose up -d --force-recreate frontend` | Reload after editing `.env.local` (`restart` does **not** re-read the env file) |
| `docker compose exec frontend <command>` | Run any npm / `npx convex` command inside the container |
| `docker compose down` | Stop everything |

> The compose file targets `linux/arm64` (Apple Silicon). On an Intel/AMD machine, change `platform` in `docker-compose.yml` and `Dockerfile` to `linux/amd64`.

### 2. Option B — Local Node.js

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start Convex and leave it running:

   ```bash
   npm run convex:dev
   ```

   On the **first run** the CLI opens a browser to log in, asks you to create (or pick) a project, and writes `CONVEX_DEPLOYMENT` and `VITE_CONVEX_URL` to `.env.local` for you. Wait for `✔ Convex functions ready!`.

3. In a **second terminal**, start the frontend:

   ```bash
   npm run dev
   ```

4. Do the [Convex Auth setup](#3-one-time-convex-auth-setup) (first time only), then open <http://localhost:5173>.

### 3. One-time Convex Auth setup

Sign-in is handled by Convex Auth with the GitHub provider (`convex/auth.ts`). Each Convex deployment needs the variables below **once**; you can set them in the dashboard (**Settings → Environment Variables**) or with `npx convex env set`.

> With Docker, prefix every `npx` / `node` command in this section with `docker compose exec frontend`, e.g. `docker compose exec frontend npx convex env set SITE_URL http://localhost:5173`.

1. **Frontend URL** — where Convex redirects back after sign-in:

   ```bash
   npx convex env set SITE_URL http://localhost:5173
   ```

2. **JWT signing keys** — generate a key pair:

   ```bash
   node generateKeys.mjs
   ```

   It prints `JWT_PRIVATE_KEY=...` and `JWKS=...`. Paste **each value** into the dashboard's Environment Variables page (the values are long and contain spaces/quotes, so the dashboard is easier than the CLI).

3. **GitHub OAuth app** — in GitHub go to **Settings → Developer settings → OAuth Apps → New OAuth App** and use:

   | Field | Value |
   |-------|-------|
   | Homepage URL | `http://localhost:5173` |
   | Authorization callback URL | `https://<your-deployment>.convex.site/api/auth/callback/github` |

   Use the same deployment name as in `VITE_CONVEX_URL`, but with **`.convex.site`** (not `.convex.cloud`). Then save the client ID and a newly generated client secret:

   ```bash
   npx convex env set AUTH_GITHUB_ID <client-id>
   npx convex env set AUTH_GITHUB_SECRET <client-secret>
   ```

`CONVEX_SITE_URL` (used by `convex/auth.config.ts`) is a built-in Convex variable; you don't need to set it.

### Environment variables reference

| Variable | Where | Purpose |
|----------|-------|---------|
| `VITE_CONVEX_URL` | `.env.local` | Convex deployment URL used by the frontend (`src/main.tsx`) |
| `CONVEX_DEPLOYMENT` | `.env.local` | Which deployment `convex dev` targets (written by the CLI on first login) |
| `CONVEX_DEPLOY_KEY` | `.env.local` | Optional; non-interactive `convex dev` (used in Docker) |
| `SITE_URL` | Convex deployment | Frontend URL to return to after OAuth |
| `JWT_PRIVATE_KEY`, `JWKS` | Convex deployment | Sign/verify auth tokens |
| `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | Convex deployment | GitHub OAuth app credentials |

`.env.local` is git-ignored (`*.local`) — never commit it.

### Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Could not find public function for '...'` | Convex isn't running or hasn't finished pushing. Start `npm run convex:dev` and wait for `Convex functions ready!` |
| Blank page / Convex client error about the URL | `VITE_CONVEX_URL` is missing or wrong in `.env.local`. Fix it and restart Vite (Docker: `docker compose up -d --force-recreate frontend`) |
| GitHub shows "redirect_uri is not associated with this application" | The OAuth callback URL must be `https://<deployment>.convex.site/api/auth/callback/github` |
| After GitHub login you land on the wrong URL or an error | Check `SITE_URL` on the Convex deployment matches the URL you open (`http://localhost:5173`) |
| `convex dev` in Docker asks to log in every time | Set `CONVEX_DEPLOY_KEY` in `.env.local` and recreate the container |
| `exec: "run": executable file not found` | Use `docker compose exec frontend npm run convex:dev` (with `npm`) |

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
| `npm run convex:dev` | Push `convex/` to the dev deployment and watch for changes (`npx convex dev`) |

## Convex

- **Schema** — `convex/schema.ts`: tables for users, expenses, expense files, bank accounts, and cards (plus auth tables from `@convex-dev/auth`).
- **API** — Functions live under `convex/`; generated types are in `convex/_generated/`.
- **Local dev** — Always use `npm run convex:dev` while iterating. `npx convex deploy` pushes to **production** and should not be used for development.

### Seeding sample data (optional)

Internal mutations can fill your dev deployment with fake data. They attach the data to the user with the email hardcoded in each function (`convex/expenses.ts`, `convex/bankAccounts.ts`, `convex/bankAccountCards.ts`). Sign in once, change that email to yours, then run:

```bash
npx convex run expenses:createFakeExpense
npx convex run bankAccounts:createFakeBankAccounts
npx convex run bankAccountCards:createFakeBankAccountCards
```

(With Docker: `docker compose exec frontend npx convex run ...`.)

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
