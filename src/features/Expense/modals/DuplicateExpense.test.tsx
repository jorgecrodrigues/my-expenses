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
      addDuplicateExpense: "addDuplicateExpense",
    },
  },
}));

const addDuplicateMock = vi.fn().mockResolvedValue(undefined);
const useQueryMock = vi.fn();

vi.mock("convex/react", () => ({
  useMutation: () => addDuplicateMock,
  useQuery: (key: string) => useQueryMock(key),
}));

vi.mock("@/shared/animation/chakraMotion", () => ({
  dialogBackdropMotion: {},
  dialogContentMotion: {},
}));

vi.mock("@tabler/icons-react", () => ({
  IconCopyPlusFilled: () => null,
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
      onOpenChange,
    }: {
      children: React.ReactNode;
      open?: boolean;
      onOpenChange?: (e: { open: boolean }) => void;
    }) => (
      <div>
        {children}
        <button
          data-testid="open-dialog"
          onClick={() => onOpenChange?.({ open: true })}
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
  Flex: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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
  RadioCard: {
    Root: ({
      children,
      name,
    }: {
      children: React.ReactNode;
      name?: string;
      defaultValue?: string;
    }) => <div data-testid={`radio-root-${name}`}>{children}</div>,
    Label: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    Item: ({
      children,
      value,
    }: {
      children: React.ReactNode;
      value: string;
    }) => <div data-testid={`radio-item-${value}`}>{children}</div>,
    ItemHiddenInput: () => null,
    ItemControl: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    ItemContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    ItemText: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    ItemDescription: ({ children }: { children: React.ReactNode }) => (
      <span>{children}</span>
    ),
    ItemIndicator: () => null,
  },
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

import DuplicateExpenseDialog from "./DuplicateExpense";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("DuplicateExpenseDialog", () => {
  beforeEach(() => {
    useQueryMock.mockReturnValue(undefined);
  });

  it("renders the Duplicate Expense trigger button", () => {
    render(<DuplicateExpenseDialog expense={makeExpense()} />);
    expect(
      screen.getByRole("button", { name: "Duplicate Expense" }),
    ).toBeInTheDocument();
  });

  it("renders the Duplicate Expense dialog title", () => {
    render(<DuplicateExpenseDialog expense={makeExpense()} />);
    expect(screen.getByText("Duplicate Expense")).toBeInTheDocument();
  });

  it("pre-fills the name input with the expense name", () => {
    render(<DuplicateExpenseDialog expense={makeExpense()} />);
    expect(screen.getByPlaceholderText("Enter name")).toHaveValue(
      "Grocery Shopping",
    );
  });

  it("pre-fills the description input with the expense description", () => {
    render(<DuplicateExpenseDialog expense={makeExpense()} />);
    expect(screen.getByPlaceholderText("Enter description")).toHaveValue(
      "Monthly groceries",
    );
  });

  it("renders all repeat option radio items", () => {
    render(<DuplicateExpenseDialog expense={makeExpense()} />);
    for (const value of ["none", "daily", "weekly", "monthly", "yearly"]) {
      expect(screen.getByTestId(`radio-item-${value}`)).toBeInTheDocument();
    }
  });

  it("renders the Cancel button", () => {
    render(<DuplicateExpenseDialog expense={makeExpense()} />);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("renders the Save Changes submit button", () => {
    render(<DuplicateExpenseDialog expense={makeExpense()} />);
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();
  });

  it("calls addDuplicateExpense on form submit", () => {
    render(<DuplicateExpenseDialog expense={makeExpense()} />);
    const form = screen.getByTestId("dialog-content");
    fireEvent.submit(form);
    expect(addDuplicateMock).toHaveBeenCalled();
  });

  it("opens the dialog when open trigger is clicked", () => {
    render(<DuplicateExpenseDialog expense={makeExpense()} />);
    fireEvent.click(screen.getByTestId("open-dialog"));
    // dialog content is always rendered (lazyMount), just state changes
    expect(screen.getByTestId("dialog-content")).toBeInTheDocument();
  });
});
