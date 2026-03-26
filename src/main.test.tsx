// @vitest-environment jsdom
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createRootMock, renderIntoRootMock, ConvexReactClientMock } = vi.hoisted(
  () => ({
    createRootMock: vi.fn(() => ({
      render: renderIntoRootMock,
    })),
    renderIntoRootMock: vi.fn(),
    ConvexReactClientMock: vi.fn(),
  }),
);

vi.stubEnv("VITE_CONVEX_URL", "https://test.convex.example");

vi.mock("./index.css", () => ({}));

vi.mock("react-dom/client", () => ({
  createRoot: createRootMock,
}));

vi.mock("convex/react", () => ({
  ConvexReactClient: ConvexReactClientMock,
}));

vi.mock("@convex-dev/auth/react", () => ({
  ConvexAuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="convex-auth">{children}</div>
  ),
}));

vi.mock("@vercel/speed-insights/react", () => ({
  SpeedInsights: () => <div data-testid="speed-insights" />,
}));

vi.mock("@/shared/components/ErrorBoundary.tsx", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

vi.mock("@/components/ui/provider.tsx", () => ({
  Provider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="ui-provider">{children}</div>
  ),
}));

vi.mock("@/components/ui/toaster.tsx", () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

vi.mock("@/App.tsx", () => ({
  default: () => <div data-testid="app">App</div>,
}));

describe("main.tsx", () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '<div id="root"></div>';
    createRootMock.mockClear();
    renderIntoRootMock.mockClear();
    ConvexReactClientMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("creates a Convex client with VITE_CONVEX_URL and mounts StrictMode into #root", async () => {
    await import("./main");

    const rootEl = document.getElementById("root");
    expect(rootEl).not.toBeNull();
    expect(ConvexReactClientMock).toHaveBeenCalledWith(
      "https://test.convex.example",
    );
    expect(createRootMock).toHaveBeenCalledTimes(1);
    expect(createRootMock).toHaveBeenCalledWith(rootEl);
    expect(renderIntoRootMock).toHaveBeenCalledTimes(1);

    const [tree] = renderIntoRootMock.mock.calls[0];
    expect(tree.type).toBe(StrictMode);
  });
});
