// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const redirectMock = vi.fn();

vi.mock("wouter", () => ({
  Redirect: ({ to }: { to: string }) => {
    redirectMock(to);
    return <div data-testid="redirect" data-to={to} />;
  },
}));

import HomePage from "./HomePage";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("HomePage", () => {
  it("renders a redirect element", () => {
    render(<HomePage />);
    expect(screen.getByTestId("redirect")).toBeInTheDocument();
  });

  it("redirects to /dashboard", () => {
    render(<HomePage />);
    expect(screen.getByTestId("redirect")).toHaveAttribute("data-to", "/dashboard");
  });

  it("calls Redirect with /dashboard target", () => {
    render(<HomePage />);
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });
});
