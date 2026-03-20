// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// --- Mocks ---

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    bankAccounts: {
      deleteBankAccount: "deleteBankAccount",
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

// --- Fixtures ---

const makeAccount = (overrides: object = {}) => ({
  _id: "acc1" as unknown as import("../../../../convex/_generated/dataModel").Id<"bankAccounts">,
  _creationTime: new Date("2025-01-15").getTime(),
  userId: "user1" as unknown as import("../../../../convex/_generated/dataModel").Id<"users">,
  accountName: "Main Checking",
  accountNumber: "1234567890",
  accountType: "checking" as const,
  accountAgency: "0001",
  accountDigit: "5",
  accountAmount: 1500,
  ...overrides,
});

import RemoveBankAccountDialog from "./RemoveBankAccount";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("RemoveBankAccountDialog", () => {
  it("renders the delete icon button trigger", () => {
    render(<RemoveBankAccountDialog account={makeAccount()} />);
    expect(
      screen.getByRole("button", { name: "Delete Bank Account" }),
    ).toBeInTheDocument();
  });

  it("shows the account name in the confirmation message", () => {
    render(<RemoveBankAccountDialog account={makeAccount()} />);
    expect(screen.getByText(/Main Checking/)).toBeInTheDocument();
  });

  it("falls back to accountNumber when accountName is absent", () => {
    render(
      <RemoveBankAccountDialog
        account={makeAccount({ accountName: undefined })}
      />,
    );
    expect(screen.getByText(/1234567890/)).toBeInTheDocument();
  });

  it("falls back to 'this account' when both accountName and accountNumber are absent", () => {
    render(
      <RemoveBankAccountDialog
        account={makeAccount({ accountName: undefined, accountNumber: undefined })}
      />,
    );
    expect(screen.getByText(/this account/)).toBeInTheDocument();
  });

  it("shows the confirmation dialog title", () => {
    render(<RemoveBankAccountDialog account={makeAccount()} />);
    expect(screen.getByText("Confirm Deletion")).toBeInTheDocument();
  });

  it("calls deleteBankAccount with the correct id when Delete is clicked", () => {
    render(<RemoveBankAccountDialog account={makeAccount()} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(deleteMock).toHaveBeenCalledWith({ id: "acc1" });
  });

  it("does not call deleteBankAccount when Cancel is clicked", () => {
    render(<RemoveBankAccountDialog account={makeAccount()} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(deleteMock).not.toHaveBeenCalled();
  });
});
