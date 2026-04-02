// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("wouter", () => ({
  Redirect: ({ to }: { to: string }) => (
    <a href={to} aria-label={`Redirect to ${to}`}>
      Redirect
    </a>
  ),
}));

import HomePage from "./HomePage";

beforeEach(() => {
  window.history.pushState({}, "", "/");
});

afterEach(() => {
  cleanup();
});

describe("HomePage", () => {
  it("renders a redirect to the dashboard route", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("link", { name: "Redirect to /dashboard" }),
    ).toHaveAttribute("href", "/dashboard");
  });
});
