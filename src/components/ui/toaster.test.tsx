// @vitest-environment jsdom
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const { toasterInstance, createToasterSpy, lastToasterProps } = vi.hoisted(
  () => {
    const instance = { id: "mock-toaster" };
    return {
      toasterInstance: instance,
      createToasterSpy: vi.fn(() => instance),
      lastToasterProps: {
        current: null as {
          toaster: unknown;
          insetInline?: unknown;
          children: (toast: Record<string, unknown>) => ReactNode;
        } | null,
      },
    };
  },
);

vi.mock("@chakra-ui/react", () => ({
  createToaster: createToasterSpy,
  Portal: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="portal">{children}</div>
  ),
  Spinner: () => <span data-testid="spinner" />,
  Stack: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="toast-stack">{children}</div>
  ),
  Toast: {
    Root: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="toast-root">{children}</div>
    ),
    Indicator: () => <span data-testid="toast-indicator" />,
    Title: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="toast-title">{children}</div>
    ),
    Description: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="toast-description">{children}</div>
    ),
    ActionTrigger: ({ children }: { children: React.ReactNode }) => (
      <button type="button" data-testid="toast-action">
        {children}
      </button>
    ),
    CloseTrigger: () => (
      <button type="button" data-testid="toast-close" aria-label="Close">
        ×
      </button>
    ),
  },
  Toaster: (props: {
    toaster: unknown;
    insetInline?: unknown;
    children: (toast: Record<string, unknown>) => React.ReactNode;
  }) => {
    lastToasterProps.current = props;
    return (
      <div data-testid="chakra-toaster">
        {props.children({ type: "loading" })}
        {props.children({
          type: "success",
          title: "Saved",
          description: "Changes applied.",
        })}
        {props.children({
          type: "success",
          title: "Action",
          action: { label: "Undo" },
        })}
        {props.children({
          type: "success",
          title: "Closable",
          closable: true,
        })}
      </div>
    );
  },
}));

import { toaster, Toaster } from "./toaster";

afterEach(() => {
  cleanup();
});

describe("toaster", () => {
  it("creates the toaster with bottom placement, idle pause, and duration", () => {
    expect(createToasterSpy).toHaveBeenCalledWith({
      placement: "bottom",
      pauseOnPageIdle: true,
      duration: 2000,
    });
    expect(toaster).toBe(toasterInstance);
  });
});

describe("Toaster", () => {
  it("renders inside a Portal and wires Chakra Toaster with the shared instance", () => {
    render(<Toaster />);

    expect(screen.getByTestId("portal")).toBeInTheDocument();
    expect(screen.getByTestId("chakra-toaster")).toBeInTheDocument();
    expect(lastToasterProps.current?.toaster).toBe(toaster);
    expect(lastToasterProps.current?.insetInline).toEqual({ mdDown: "4" });
  });

  it("renders a spinner for loading toasts and an indicator otherwise", () => {
    render(<Toaster />);
    expect(screen.getAllByTestId("spinner").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTestId("toast-indicator").length).toBeGreaterThanOrEqual(1);
  });

  it("renders title and description when present", () => {
    render(<Toaster />);
    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("Changes applied.")).toBeInTheDocument();
  });

  it("renders an action trigger when toast.action is set", () => {
    render(<Toaster />);
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
  });

  it("renders a close trigger when toast.closable is true", () => {
    render(<Toaster />);
    const closeButtons = screen.getAllByTestId("toast-close");
    expect(closeButtons.length).toBeGreaterThanOrEqual(1);
  });
});
