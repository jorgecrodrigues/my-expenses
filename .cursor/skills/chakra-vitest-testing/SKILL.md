---
name: chakra-vitest-testing
description: >-
  Writes unit and integration tests for React components with Chakra UI using
  Vitest, Testing Library, and jsdom. Covers when to mock Chakra vs wrap with
  ChakraProvider, jest-dom matchers, query order, cleanup, and common browser
  API stubs. Use when adding or refactoring tests, when the user mentions
  Vitest, Testing Library, Chakra UI in tests, component tests, or integration
  tests for the UI.
---

# Chakra UI + Vitest testing

## When to read this

- **Unit tests (Chakra mocked):** Assert structure, props forwarding, or logic with minimal HTML stubs — fast, no full theme/CSS pipeline.
- **Integration tests (real Chakra):** Wrap with `ChakraProvider` and `defaultSystem` so real Chakra components run — use for behavior, roles, labels, and layout that depend on Chakra.

This repo’s detailed rules live in `.claude/rules/testing-standards.md`; follow them alongside this skill.

## File setup

| Item | Rule |
|------|------|
| Placement | Co-locate: `Component.tsx` → `Component.test.tsx` |
| Extension | `.test.tsx` if JSX renders; `.test.ts` for pure utilities |
| Environment | First line of DOM tests: `// @vitest-environment jsdom` |
| Pure utils | No `jsdom` line if no DOM APIs |

## Imports (typical)

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
```

Add `renderHook`, `act`, `userEvent`, or `fireEvent` when needed.

## Always: cleanup and query style

- Call `cleanup()` in `afterEach` for component tests to avoid bleed between cases.
- Prefer queries in order: **`getByRole`** → **`getByLabelText`** → **`getByText`**.
- Avoid snapshot tests unless the team explicitly wants them.

## Unit tests: mock Chakra

Place `vi.mock("@chakra-ui/react", () => ({ ... }))` at the **top** of the file (Vitest hoists mocks). Only stub components the SUT actually imports.

Use `vi.hoisted()` when mock implementations need shared refs or spies:

```ts
const { lastValue } = vi.hoisted(() => ({
  lastValue: { current: null as unknown },
}));

vi.mock("@chakra-ui/react", () => ({
  ChakraProvider: ({ children, value }: { children: React.ReactNode; value: unknown }) => {
    lastValue.current = value;
    return <div data-testid="chakra-provider">{children}</div>;
  },
}));
```

Import the component under test **after** mocks.

## Integration tests: real Chakra

Wrap the tree with Chakra’s provider and the default design system:

```ts
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";

function renderWithChakra(ui: React.ReactElement) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}
```

If the app uses a custom `Provider` (theme + color mode), use that wrapper when testing features that depend on it.

## Mocking other modules

- **`vi.mock(...)`** at top of file, before imports of the mocked module.
- **Icons** (e.g. `@tabler/icons-react`): mock as `<span aria-hidden />` or simple elements to keep queries stable.
- **Convex** (`useQuery`, `useMutation`, auth wrappers): use `vi.fn()` and module-level state you reset in `beforeEach` — see `.claude/rules/testing-standards.md`.
- **Routing:** reset with `window.history.pushState({}, "", "/")` in `beforeEach` when the test depends on the URL.

## Browser APIs in jsdom

Stub when components or Chakra use them and tests fail:

- **`ResizeObserver`:** assign a no-op class to `globalThis.ResizeObserver` in `beforeAll` for that file or suite.
- **`IntersectionObserver`:** same pattern, or mock in hook tests per existing `useIntersectionObserver` tests.

## Running tests

```bash
npm run test
npx vitest run src/path/to/Component.test.tsx
npm run test:coverage
```

## Quick checklist

- [ ] `jsdom` directive on DOM test files
- [ ] `jest-dom/vitest` imported in component/hook tests
- [ ] Mocks before imports; `cleanup()` in `afterEach`
- [ ] Choose mock-Chakra vs `renderWithChakra` intentionally
- [ ] Semantic queries; reset route/Convex/auth state between tests when applicable
