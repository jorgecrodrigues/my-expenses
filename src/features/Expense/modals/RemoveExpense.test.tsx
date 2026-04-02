// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    expenses: {
      deleteExpense: "deleteExpense",
    },
  },
}));

const deleteMock = vi.fn().mockResolvedValue(undefined);

vi.mock("convex/react", () => ({
  useMutation: () => deleteMock,
}));

vi.mock("@/shared/animation/chakraMotion", () => ({
  dialogBackdropMotion: {},
  dialogContentMotion: {},
}));

vi.mock("@tabler/icons-react", () => ({
  IconTrash: () => null,
}));

vi.mock("@chakra-ui/react", () => ({
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
  CloseButton: () => <button>Close</button>,
  Dialog: {
    Root: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    Trigger: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="dialog-trigger">{children}</div>
    ),
    Backdrop: () => null,
    Positioner: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    Content: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="dialog-content">{children}</div>
    ),
    Header: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    Title: ({ children }: { children: React.ReactNode }) => (
      <h2>{children}</h2>
    ),
    Body: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="dialog-body">{children}</div>
    ),
    Footer: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    ActionTrigger: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    CloseTrigger: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  },
  IconButton: ({
    "aria-label": ariaLabel,
    children,
  }: {
    "aria-label": string;
    children: React.ReactNode;
  }) => <button aria-label={ariaLabel}>{children}</button>,
  Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import RemoveExpenseDialog from "./RemoveExpense";

function makeExpense(overrides: Partial<Doc<"expenses">> = {}): Doc<"expenses"> {
  return {
    _id: "exp1" as Id<"expenses">,
    _creationTime: Date.now(),
    userId: "user1" as Id<"users">,
    name: "Rent",
    description: "Monthly",
    amount: 800,
    category: "Housing",
    date: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("RemoveExpenseDialog", () => {
  it("renders the delete icon button trigger", () => {
    render(<RemoveExpenseDialog expense={makeExpense()} />);
    expect(
      screen.getByRole("button", { name: "Delete Expense" }),
    ).toBeInTheDocument();
  });

  it("shows the expense name in the confirmation message", () => {
    render(<RemoveExpenseDialog expense={makeExpense()} />);
    expect(screen.getByText(/Rent/)).toBeInTheDocument();
  });

  it("shows the confirmation dialog title", () => {
    render(<RemoveExpenseDialog expense={makeExpense()} />);
    expect(screen.getByText("Confirm Deletion")).toBeInTheDocument();
  });

  it("calls deleteExpense with the expense id when Delete is clicked", () => {
    render(<RemoveExpenseDialog expense={makeExpense()} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(deleteMock).toHaveBeenCalledWith({ id: "exp1" });
  });

  it("does not call deleteExpense when Cancel is clicked", () => {
    render(<RemoveExpenseDialog expense={makeExpense()} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(deleteMock).not.toHaveBeenCalled();
  });
});
