// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const { useQueryMock, captured } = vi.hoisted(() => ({
  useQueryMock: vi.fn(),
  captured: {} as Record<string, Record<string, unknown> | undefined>,
}));

vi.mock("../../../../convex/_generated/api", () => ({
  api: { expensesfiles: { getExpenseFiles: "getExpenseFiles" } },
}));

vi.mock("convex/react", () => ({ useQuery: useQueryMock }));

vi.mock("@/shared/animation/chakraMotion", () => ({
  dialogBackdropMotion: {},
  dialogContentMotion: {},
}));

vi.mock("@chakra-ui/react", () => {
  const Div = ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  );
  return {
    CloseButton: () => <button type="button">Close</button>,
    Dialog: {
      Root: ({
        children,
        onOpenChange,
      }: {
        children: React.ReactNode;
        onOpenChange: (details: { open: boolean }) => void;
      }) => (
        <div onClick={() => onOpenChange({ open: true })}>{children}</div>
      ),
      Trigger: Div,
      Backdrop: () => null,
      Positioner: Div,
      Content: Div,
      Header: Div,
      Title: ({ children }: { children: React.ReactNode }) => (
        <h2>{children}</h2>
      ),
      Body: Div,
      CloseTrigger: Div,
    },
    Icon: () => null,
    IconButton: ({
      children,
      "aria-label": ariaLabel,
    }: {
      children: React.ReactNode;
      "aria-label": string;
    }) => (
      <button type="button" aria-label={ariaLabel}>
        {children}
      </button>
    ),
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Text: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  };
});

vi.mock("@tabler/icons-react", () => ({
  IconArchiveFilled: () => <span />,
}));

vi.mock("../components/ExpenseFileUploader", () => ({
  default: (props: Record<string, unknown>) => {
    captured.uploader = props;
    return <div data-testid="uploader" />;
  },
}));

vi.mock("../components/ExpenseFilesTable", () => ({
  default: (props: Record<string, unknown>) => {
    captured.table = props;
    return <div data-testid="files-table" />;
  },
}));

import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import ManageExpenseFiles from "./ManageExpenseFiles";

function makeExpense(): Doc<"expenses"> {
  return {
    _id: "exp1" as Id<"expenses">,
    _creationTime: 0,
    userId: "user1" as Id<"users">,
    name: "Invoice A",
    amount: 200,
    category: "Office",
    date: "2025-05-01T10:00",
  };
}

const files = [{ _id: "file1" }];

beforeEach(() => {
  useQueryMock.mockImplementation((_query: unknown, args: unknown) =>
    args === "skip" ? undefined : files,
  );
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  for (const key of Object.keys(captured)) delete captured[key];
});

describe("ManageExpenseFiles", () => {
  it("renders the trigger, title and expense details", () => {
    render(<ManageExpenseFiles expense={makeExpense()} />);

    expect(
      screen.getByRole("button", { name: "Manage Expense Files" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Manage Expense Files" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Invoice A")).toBeInTheDocument();
  });

  it("does not query files while closed", () => {
    render(<ManageExpenseFiles expense={makeExpense()} />);

    expect(useQueryMock).toHaveBeenLastCalledWith("getExpenseFiles", "skip");
    expect(captured.table?.files).toBeUndefined();
  });

  it("loads the expense files once opened and wires the children", () => {
    render(<ManageExpenseFiles expense={makeExpense()} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Manage Expense Files" }),
    );

    expect(useQueryMock).toHaveBeenLastCalledWith("getExpenseFiles", {
      expenseId: "exp1",
    });
    expect(captured.table?.files).toBe(files);
    expect(captured.uploader?.expenseId).toBe("exp1");
  });
});
