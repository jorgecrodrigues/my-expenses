// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    users: { viewer: "users.viewer" },
    expenses: {
      addExpense: "addExpense",
      updateExpense: "updateExpense",
      getExpenseCategoryOptions: "getExpenseCategoryOptions",
    },
  },
}));

const addMock = vi.fn().mockResolvedValue(undefined);
const updateMock = vi.fn().mockResolvedValue(undefined);

vi.mock("convex/react", () => ({
  useMutation: (fn: string) => {
    if (fn === "addExpense") return addMock;
    if (fn === "updateExpense") return updateMock;
    return vi.fn().mockResolvedValue(undefined);
  },
  useQuery: (fn: string) => {
    if (fn === "users.viewer") return { _id: "user1" };
    if (fn === "getExpenseCategoryOptions") {
      return [{ value: "food", label: "Food" }];
    }
    return undefined;
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

vi.mock("../components/CategoryCombobox", () => ({
  default: () => <div data-testid="category-combobox" />,
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
    RequiredIndicator: () => <span aria-hidden>*</span>,
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
  Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import CreateOrEditExpenseDialog from "./CreateOrEditExpense";

const mockExpense: Doc<"expenses"> = {
  _id: "exp1" as Id<"expenses">,
  _creationTime: new Date("2025-03-01").getTime(),
  userId: "user1" as Id<"users">,
  name: "Utilities",
  description: "Electric bill",
  amount: 120,
  category: "Home",
  date: "2025-03-15T14:00:00.000Z",
  paidAt: undefined,
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CreateOrEditExpenseDialog", () => {
  describe("create mode (no expense prop)", () => {
    it("renders an Add Expense button as the trigger", () => {
      render(<CreateOrEditExpenseDialog />);
      const trigger = screen.getByTestId("dialog-trigger");
      expect(
        within(trigger).getByRole("button", { name: /add expense/i }),
      ).toBeInTheDocument();
    });

    it("shows Add New Expense as the dialog title", () => {
      render(<CreateOrEditExpenseDialog />);
      expect(screen.getByText("Add New Expense")).toBeInTheDocument();
    });

    it("calls addExpense on form submit", () => {
      render(<CreateOrEditExpenseDialog />);
      fireEvent.submit(screen.getByTestId("dialog-form"));
      expect(addMock).toHaveBeenCalled();
    });

    it("does not call updateExpense on submit in create mode", () => {
      render(<CreateOrEditExpenseDialog />);
      fireEvent.submit(screen.getByTestId("dialog-form"));
      expect(updateMock).not.toHaveBeenCalled();
    });
  });

  describe("edit mode (expense prop provided)", () => {
    it("renders an Edit Expense icon button as the trigger", () => {
      render(<CreateOrEditExpenseDialog expense={mockExpense} />);
      expect(
        screen.getByRole("button", { name: "Edit Expense" }),
      ).toBeInTheDocument();
    });

    it("shows Edit Expense as the dialog title", () => {
      render(<CreateOrEditExpenseDialog expense={mockExpense} />);
      expect(screen.getByText("Edit Expense")).toBeInTheDocument();
    });

    it("pre-fills name from the expense", () => {
      render(<CreateOrEditExpenseDialog expense={mockExpense} />);
      const nameInput = screen.getByPlaceholderText("Enter name") as HTMLInputElement;
      expect(nameInput.defaultValue).toBe("Utilities");
    });

    it("calls updateExpense with the expense id on submit", () => {
      render(<CreateOrEditExpenseDialog expense={mockExpense} />);
      fireEvent.submit(screen.getByTestId("dialog-form"));
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ id: "exp1" }),
      );
    });

    it("does not call addExpense on submit in edit mode", () => {
      render(<CreateOrEditExpenseDialog expense={mockExpense} />);
      fireEvent.submit(screen.getByTestId("dialog-form"));
      expect(addMock).not.toHaveBeenCalled();
    });
  });
});
