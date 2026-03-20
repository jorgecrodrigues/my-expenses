# Dev Workflow

## Running locally
Both servers must run simultaneously in separate terminals:
```bash
npm run dev          # Vite frontend (port 5173)
npm run convex:dev   # Convex backend (watches convex/ for changes)
```

## Checks to run after changes
- `npm run lint` — ESLint (always)
- `npm run test` — Vitest (after logic changes)
- Verify Convex dev console after touching backend files

## Single test
```bash
npx vitest run src/path/to/file.test.tsx
```

## Coverage
```bash
npm run test:coverage   # generates coverage/ dir
npm run coverage:badge  # updates badge in README
```
