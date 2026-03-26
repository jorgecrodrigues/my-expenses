// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import ErrorBoundary from "./ErrorBoundary";

function StableChild() {
  return <div>child content</div>;
}

function ThrowingChild(): never {
  throw new Error("render failure");
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ErrorBoundary", () => {
  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary fallback={<div>fallback</div>}>
        <StableChild />
      </ErrorBoundary>,
    );
    expect(screen.getByText("child content")).toBeInTheDocument();
    expect(screen.queryByText("fallback")).not.toBeInTheDocument();
  });

  it("renders fallback when a child throws during render", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={<div>fallback ui</div>}>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    expect(screen.getByText("fallback ui")).toBeInTheDocument();
    expect(screen.queryByText("child content")).not.toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith(
      "ErrorBoundary caught an error",
      expect.objectContaining({ message: "render failure" }),
      expect.any(Object),
    );
  });
});
