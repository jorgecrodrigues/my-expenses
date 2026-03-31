// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// --- Mocks ---

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    users: { viewer: "viewer" },
    expenses: {
      getExpenseCategoryOptions: "getExpenseCategoryOptions",
      addExpense: "addExpense",
      updateExpense: "updateExpense",
    },
  },
}));

const addExpenseMock = vi.fn().mockResolvedValue(undefined);
const updateExpenseMock = vi.fn().mockResolvedValue(undefined);
const useQueryMock = vi.fn();

vi.mock("convex/react", () => ({
  useMutation: (key: string) => {
    if (key === "addExpense") return addExpenseMock;
    if (key === "updateExpense") return updateExpenseMock;
    return vi.fn();
  },
  useQuery: (key: string) => useQueryMock(key),
}));

vi.mock("@/shared/animation/chakraMotion", () => ({
  dialogBackdropMotion: {},
  dialogContentMotion: {},
}));

vi.mock("@tabler/icons-react", () => ({
  IconEdit: () => null,
  IconPlus: () => null,
}));

vi.mock("../components/CategoryCombobox", () => ({
  default: () => <input name="category" defaultValue="" aria-label="Category" />,
}));

vi.mock("../../../shared/components/BRLCurrencyInput", () => ({
  default: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} aria-label="Amount (BRL)" />
  ),
}));

vi.mock("../../../components/ui/toaster", () => ({
  toaster: { create: vi.fn() },
}));

vi.mock("@chakra-ui/react", () => ({
  Button: ({
    children,
    onClick,
    type,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    type?: string;
  }) => (
    <button onClick={onClick} type={(type as "button" | "submit" | "reset") ?? "button"}>
      {children}
    </button>
  ),
  CloseButton: () => <button>Close</button>,
  Dialog: {
    Root: ({
      children,
      open,
      onOpenChange,
    }: {
      children: React.ReactNode;
      open?: boolean;
      onOpenChange?: (e: { open: boolean }) => void;
    }) => (
      <div>
        {children}
        {/* expose a helper to open the dialog in tests */}
        <button
          data-testid="open-dialog"
          onClick={() => onOpenChange?.({ open: true })}
        />
        <button
          data-testid="close-dialog"
          onClick={() => onOpenChange?.({ open: false })}
        />
      </div>
    ),
    Trigger: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="dialog-trigger">{children}</div>
    ),
    Backdrop: () => null,
    Positioner: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Content: ({
      children,
      onSubmit,
    }: {
      children: React.ReactNode;
      onSubmit?: React.FormEventHandler;
      as?: string;
    }) => (
      <form data-testid="dialog-content" onSubmit={onSubmit}>
        {children}
      </form>
    ),
    Header: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Title: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
    Body: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="dialog-body">{children}</div>
    ),
    Footer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    ActionTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    CloseTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
  Field: {
    Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Label: ({ children }: { children: React.ReactNode }) => (
      <label>{children}</label>
    ),
    RequiredIndicator: () => <span>*</span>,
    HelperText: ({ children }: { children: React.ReactNode }) => (
      <span>{children}</span>
    ),
    ErrorText: () => null,
  },
  HStack: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IconButton: ({
    "aria-label": ariaLabel,
    children,
  }: {
    "aria-label": string;
    children: React.ReactNode;
  }) => <button aria-label={ariaLabel}>{children}</button>,
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
  Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// --- Fixtures ---

const makeExpense = (overrides: object = {}) => ({
  _id: "exp1" as unknown as import("../../../../convex/_generated/dataModel").Id<"expenses">,
  _creationTime: new Date("2025-01-15").getTime(),
  userId:
    "user1" as unknown as import("../../../../convex/_generated/dataModel").Id<"users">,
  name: "Grocery Shopping",
  description: "Monthly groceries",
  amount: 250.0,
  date: new Date("2025-01-15").getTime(),
  category: "Food",
  paidAt: undefined,
  repeat: "none" as const,
  repeatStartDate: "",
  repeatEndDate: "",
  ...overrides,
});

import CreateOrEditExpenseDialog from "./CreateOrEditExpense";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CreateOrEditExpenseDialog", () => {
  beforeEach(() => {
    useQueryMock.mockReturnValue(undefined);
  });

  describe("create mode (no expense prop)", () => {
    it("renders the Add Expense trigger button", () => {
      render(<CreateOrEditExpenseDialog />);
      const buttons = screen.getAllByRole("button", { name: /Add Expense/i });
      // Trigger button + submit button both have "Add Expense" label in create mode
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });

    it("renders the Add New Expense dialog title", () => {
      render(<CreateOrEditExpenseDialog />);
      expect(screen.getByText("Add New Expense")).toBeInTheDocument();
    });

    it("renders Add Expense submit button in create mode", () => {
      render(<CreateOrEditExpenseDialog />);
      // There are two "Add Expense" buttons: trigger + submit
      const buttons = screen.getAllByRole("button", { name: /Add Expense/i });
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("edit mode (expense prop provided)", () => {
    it("renders the Edit Expense trigger button", () => {
      render(<CreateOrEditExpenseDialog expense={makeExpense()} />);
      expect(
        screen.getByRole("button", { name: "Edit Expense" }),
      ).toBeInTheDocument();
    });

    it("renders the Edit Expense dialog title", () => {
      render(<CreateOrEditExpenseDialog expense={makeExpense()} />);
      expect(screen.getByText("Edit Expense")).toBeInTheDocument();
    });

    it("pre-fills the name input with the expense name", () => {
      render(<CreateOrEditExpenseDialog expense={makeExpense()} />);
      const nameInput = screen.getByPlaceholderText("Enter name");
      expect(nameInput).toHaveValue("Grocery Shopping");
    });

    it("pre-fills the description input with the expense description", () => {
      render(<CreateOrEditExpenseDialog expense={makeExpense()} />);
      const descInput = screen.getByPlaceholderText("Enter description");
      expect(descInput).toHaveValue("Monthly groceries");
    });

    it("renders Save Changes submit button in edit mode", () => {
      render(<CreateOrEditExpenseDialog expense={makeExpense()} />);
      expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();
    });
  });

  describe("form submission", () => {
    it("calls addExpense on submit in create mode", () => {
      render(<CreateOrEditExpenseDialog />);
      const form = screen.getByTestId("dialog-content");
      fireEvent.submit(form);
      expect(addExpenseMock).toHaveBeenCalled();
    });

    it("calls updateExpense on submit in edit mode", () => {
      render(<CreateOrEditExpenseDialog expense={makeExpense()} />);
      const form = screen.getByTestId("dialog-content");
      fireEvent.submit(form);
      expect(updateExpenseMock).toHaveBeenCalledWith(
        expect.objectContaining({ id: "exp1" }),
      );
    });
  });
});
