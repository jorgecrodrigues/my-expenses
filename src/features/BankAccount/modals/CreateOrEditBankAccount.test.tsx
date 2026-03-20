// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// --- Mocks ---

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    bankAccounts: {
      addBankAccount: "addBankAccount",
      updateBankAccount: "updateBankAccount",
    },
  },
}));

const addMock = vi.fn().mockResolvedValue(undefined);
const updateMock = vi.fn().mockResolvedValue(undefined);

vi.mock("convex/react", () => ({
  useMutation: (fn: string) => {
    if (fn === "addBankAccount") return addMock;
    if (fn === "updateBankAccount") return updateMock;
    return vi.fn().mockResolvedValue(undefined);
  },
}));

vi.mock("@/components/ui/toaster", () => ({
  toaster: { create: vi.fn() },
}));

vi.mock("@/shared/animation/chakraMotion", () => ({
  dialogBackdropMotion: {},
  dialogContentMotion: {},
}));

vi.mock("@/shared/components/BRLCurrencyInput", () => ({
  default: ({
    name,
    placeholder,
    defaultValue,
  }: {
    name?: string;
    placeholder?: string;
    defaultValue?: number;
  }) => (
    <input
      name={name}
      placeholder={placeholder}
      defaultValue={defaultValue}
      data-testid="brl-input"
    />
  ),
}));

vi.mock("@tabler/icons-react", () => ({
  IconEdit: () => null,
  IconPlus: () => null,
}));

vi.mock("@chakra-ui/react", () => ({
  Button: ({
    children,
    type,
  }: {
    children: React.ReactNode;
    type?: string;
  }) => <button type={(type as "submit") ?? "button"}>{children}</button>,
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
    Content: ({
      children,
      onSubmit,
    }: {
      children: React.ReactNode;
      onSubmit?: React.FormEventHandler;
    }) => (
      <form data-testid="dialog-form" onSubmit={onSubmit}>
        {children}
      </form>
    ),
    Header: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    Title: ({ children }: { children: React.ReactNode }) => (
      <h2>{children}</h2>
    ),
    Body: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
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
  Field: {
    Root: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    Label: ({ children }: { children: React.ReactNode }) => (
      <label>{children}</label>
    ),
    HelperText: () => null,
    ErrorText: () => null,
  },
  HStack: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  IconButton: ({
    "aria-label": ariaLabel,
    children,
  }: {
    "aria-label": string;
    children: React.ReactNode;
  }) => <button aria-label={ariaLabel}>{children}</button>,
  Input: ({
    name,
    placeholder,
    defaultValue,
    type,
  }: {
    name?: string;
    placeholder?: string;
    defaultValue?: string;
    type?: string;
  }) => (
    <input
      name={name}
      placeholder={placeholder}
      defaultValue={defaultValue}
      type={type}
    />
  ),
  NativeSelect: {
    Root: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    Field: ({
      children,
      name,
      defaultValue,
    }: {
      children: React.ReactNode;
      name?: string;
      defaultValue?: string;
    }) => (
      <select name={name} defaultValue={defaultValue}>
        {children}
      </select>
    ),
    Indicator: () => null,
  },
  Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// --- Fixtures ---

const mockAccount = {
  _id: "acc1" as unknown as import("../../../../convex/_generated/dataModel").Id<"bankAccounts">,
  _creationTime: new Date("2025-01-15").getTime(),
  userId: "user1" as unknown as import("../../../../convex/_generated/dataModel").Id<"users">,
  accountName: "Main Checking",
  accountType: "checking" as const,
  accountNumber: "1234567890",
  accountAgency: "0001",
  accountDigit: "5",
  accountAmount: 1500,
};

import CreateOrEditBankAccountDialog from "./CreateOrEditBankAccount";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CreateOrEditBankAccountDialog", () => {
  describe("create mode (no account prop)", () => {
    it("renders an Add Account button as the trigger", () => {
      render(<CreateOrEditBankAccountDialog />);
      const trigger = screen.getByTestId("dialog-trigger");
      expect(
        within(trigger).getByRole("button", { name: /add account/i }),
      ).toBeInTheDocument();
    });

    it("shows 'Add New Account' as the dialog title", () => {
      render(<CreateOrEditBankAccountDialog />);
      expect(screen.getByText("Add New Account")).toBeInTheDocument();
    });

    it("calls addBankAccount on form submit", () => {
      render(<CreateOrEditBankAccountDialog />);
      fireEvent.change(screen.getByPlaceholderText("Enter account name"), {
        target: { name: "accountName", value: "New Account" },
      });
      fireEvent.submit(screen.getByTestId("dialog-form"));
      expect(addMock).toHaveBeenCalled();
    });

    it("does not call updateBankAccount on submit", () => {
      render(<CreateOrEditBankAccountDialog />);
      fireEvent.submit(screen.getByTestId("dialog-form"));
      expect(updateMock).not.toHaveBeenCalled();
    });
  });

  describe("edit mode (account prop provided)", () => {
    it("renders an Edit Bank Account icon button as the trigger", () => {
      render(<CreateOrEditBankAccountDialog account={mockAccount} />);
      expect(
        screen.getByRole("button", { name: "Edit Bank Account" }),
      ).toBeInTheDocument();
    });

    it("shows 'Edit Account' as the dialog title", () => {
      render(<CreateOrEditBankAccountDialog account={mockAccount} />);
      expect(screen.getByText("Edit Account")).toBeInTheDocument();
    });

    it("pre-fills the account name input", () => {
      render(<CreateOrEditBankAccountDialog account={mockAccount} />);
      const nameInput = screen.getByPlaceholderText(
        "Enter account name",
      ) as HTMLInputElement;
      expect(nameInput.defaultValue).toBe("Main Checking");
    });

    it("pre-fills the account number input", () => {
      render(<CreateOrEditBankAccountDialog account={mockAccount} />);
      const numberInput = screen.getByPlaceholderText(
        "Enter account number",
      ) as HTMLInputElement;
      expect(numberInput.defaultValue).toBe("1234567890");
    });

    it("calls updateBankAccount with the account id on submit", () => {
      render(<CreateOrEditBankAccountDialog account={mockAccount} />);
      fireEvent.submit(screen.getByTestId("dialog-form"));
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ id: "acc1" }),
      );
    });

    it("does not call addBankAccount on submit", () => {
      render(<CreateOrEditBankAccountDialog account={mockAccount} />);
      fireEvent.submit(screen.getByTestId("dialog-form"));
      expect(addMock).not.toHaveBeenCalled();
    });
  });
});
