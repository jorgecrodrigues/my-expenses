// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    users: { viewer: "users.viewer" },
    expenses: {
      addDuplicateExpense: "addDuplicateExpense",
      getExpenseCategoryOptions: "getExpenseCategoryOptions",
    },
  },
}));

const duplicateMock = vi.fn().mockResolvedValue(undefined);

vi.mock("convex/react", () => ({
  useMutation: () => duplicateMock,
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
  IconCopyPlusFilled: () => null,
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
  Flex: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
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
  RadioCard: {
    Root: ({
      children,
      name,
      defaultValue,
    }: {
      children: React.ReactNode;
      name?: string;
      defaultValue?: string;
    }) => (
      <fieldset data-name={name} data-default={defaultValue}>
        {children}
      </fieldset>
    ),
    Label: ({ children }: { children: React.ReactNode }) => (
      <legend>{children}</legend>
    ),
    Item: ({
      children,
      value,
    }: {
      children: React.ReactNode;
      value: string;
    }) => (
      <label>
        <input type="radio" name="repeat" value={value} defaultChecked={value === "none"} />
        {children}
      </label>
    ),
    ItemHiddenInput: () => null,
    ItemControl: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    ItemContent: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    ItemText: ({ children }: { children: React.ReactNode }) => (
      <span>{children}</span>
    ),
    ItemDescription: ({ children }: { children: React.ReactNode }) => (
      <span>{children}</span>
    ),
    ItemIndicator: () => null,
  },
}));

import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import DuplicateExpenseDialog from "./DuplicateExpense";

const mockExpense: Doc<"expenses"> = {
  _id: "exp1" as Id<"expenses">,
  _creationTime: new Date("2025-04-01").getTime(),
  userId: "user1" as Id<"users">,
  name: "Subscription",
  description: "App fee",
  amount: 29.9,
  category: "Software",
  date: "2025-04-10T12:00:00.000Z",
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("DuplicateExpenseDialog", () => {
  it("renders the duplicate icon button trigger", () => {
    render(<DuplicateExpenseDialog expense={mockExpense} />);
    expect(
      screen.getByRole("button", { name: "Duplicate Expense" }),
    ).toBeInTheDocument();
  });

  it("shows Duplicate Expense as the dialog title", () => {
    render(<DuplicateExpenseDialog expense={mockExpense} />);
    expect(screen.getByText("Duplicate Expense")).toBeInTheDocument();
  });

  it("pre-fills name and description from the expense", () => {
    render(<DuplicateExpenseDialog expense={mockExpense} />);
    expect(
      (screen.getByPlaceholderText("Enter name") as HTMLInputElement).defaultValue,
    ).toBe("Subscription");
    expect(
      (screen.getByPlaceholderText("Enter description") as HTMLInputElement)
        .defaultValue,
    ).toBe("App fee");
  });

  it("calls addDuplicateExpense on form submit", () => {
    render(<DuplicateExpenseDialog expense={mockExpense} />);
    fireEvent.submit(screen.getByTestId("dialog-form"));
    expect(duplicateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user1",
        date: mockExpense.date,
      }),
    );
  });
});
