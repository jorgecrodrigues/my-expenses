// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

let authState: "loading" | "authenticated" | "unauthenticated" = "loading";

vi.mock("convex/react", () => ({
  AuthLoading: ({ children }: { children: React.ReactNode }) =>
    authState === "loading" ? <>{children}</> : null,
  Authenticated: ({ children }: { children: React.ReactNode }) =>
    authState === "authenticated" ? <>{children}</> : null,
  Unauthenticated: ({ children }: { children: React.ReactNode }) =>
    authState === "unauthenticated" ? <>{children}</> : null,
}));

vi.mock("@chakra-ui/react", () => ({
  createToaster: () => ({}),
  Box: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Center: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/shared/components/Logo", () => ({
  default: ({ loading }: { loading?: boolean }) => (
    <div>Logo {loading ? "loading" : "idle"}</div>
  ),
}));

vi.mock("@/shared/components/AppGrid", () => ({
  default: ({
    header,
    sidebar,
    children,
  }: {
    header: React.ReactNode;
    sidebar: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div>
      <div data-testid="header">{header}</div>
      <div data-testid="sidebar">{sidebar}</div>
      <div data-testid="content">{children}</div>
    </div>
  ),
}));

vi.mock("@/shared/components/Header", () => ({
  default: () => <div>Header</div>,
}));

vi.mock("@/shared/components/Sidebar", () => ({
  default: () => <div>Sidebar</div>,
}));

vi.mock("@/features/Auth/pages/SignIn", () => ({
  default: () => <div>SignIn</div>,
}));

vi.mock("@/features/Home/pages/HomePage", () => ({
  default: () => <div>HomePage</div>,
}));

vi.mock("@/features/Dashboard/pages/DashboardPage", () => ({
  default: () => <div>DashboardPage</div>,
}));

vi.mock("@/features/Expense/pages/ExpensePage", () => ({
  default: () => <div>ExpensePage</div>,
}));

vi.mock("./features/About/pages/AboutPage", () => ({
  default: () => <div>AboutPage</div>,
}));

import App from "./App";

beforeEach(() => {
  window.history.pushState({}, "", "/");
});

afterEach(() => {
  cleanup();
});

describe("App", () => {
  it("shows loading screen while auth is loading", () => {
    authState = "loading";
    render(<App />);
    expect(screen.getByText("Logo loading")).toBeInTheDocument();
  });

  it("renders authenticated layout and home route", () => {
    authState = "authenticated";
    render(<App />);

    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Sidebar")).toBeInTheDocument();
    expect(screen.getByText("HomePage")).toBeInTheDocument();
  });

  it("renders 404 for unknown route when authenticated", () => {
    authState = "authenticated";
    window.history.pushState({}, "", "/nope");
    render(<App />);

    expect(screen.getByText("404 - Page Not Found")).toBeInTheDocument();
  });

  it("renders sign-in when unauthenticated", () => {
    authState = "unauthenticated";
    render(<App />);
    expect(screen.getByText("SignIn")).toBeInTheDocument();
  });
});
