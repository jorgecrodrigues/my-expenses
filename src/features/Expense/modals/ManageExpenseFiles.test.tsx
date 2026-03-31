// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// --- Mocks ---

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    expensesfiles: {
      generateUploadUrl: "generateUploadUrl",
      sendFile: "sendFile",
      getExpenseFiles: "getExpenseFiles",
      getUrl: "getUrl",
      deleteExpenseFile: "deleteExpenseFile",
    },
  },
}));

const generateUploadUrlMock = vi.fn().mockResolvedValue("https://upload.example.com");
const sendFileMock = vi.fn().mockResolvedValue(undefined);
const deleteFileMock = vi.fn().mockResolvedValue(undefined);
const useQueryMock = vi.fn();
const useMutationMock = vi.fn();

vi.mock("convex/react", () => ({
  useMutation: (key: string) => useMutationMock(key),
  useQuery: (key: string, ...args: unknown[]) => useQueryMock(key, ...args),
}));

vi.mock("@/shared/animation/chakraMotion", () => ({
  dialogBackdropMotion: {},
  dialogContentMotion: {},
  popoverContentMotion: {},
}));

vi.mock("@tabler/icons-react", () => ({
  IconArchiveFilled: () => null,
  IconDownload: () => null,
  IconFiles: () => null,
  IconTrash: () => null,
  IconUpload: () => null,
}));

vi.mock("@/components/ui/toaster", () => ({
  toaster: { create: vi.fn() },
}));

vi.mock("@chakra-ui/react", () => ({
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled}>
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
    Content: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="dialog-content">{children}</div>
    ),
    Header: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Title: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
    Body: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="dialog-body">{children}</div>
    ),
    CloseTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
  Editable: {
    Root: ({
      children,
    }: {
      children: React.ReactNode;
      defaultValue?: string;
      onValueCommit?: (v: { value: string }) => void;
    }) => <div>{children}</div>,
    Preview: () => null,
    Input: () => null,
  },
  FileUpload: {
    RootProvider: ({
      children,
    }: {
      children: React.ReactNode;
      value?: unknown;
    }) => <div>{children}</div>,
    HiddenInput: () => null,
    Trigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    ItemGroup: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    Item: ({ children }: { children: React.ReactNode; file?: unknown }) => (
      <div>{children}</div>
    ),
    ItemSizeText: () => null,
    ItemDeleteTrigger: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  },
  FormatByte: ({ value }: { value: number }) => <span>{value}</span>,
  HStack: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Icon: () => null,
  IconButton: ({
    "aria-label": ariaLabel,
    children,
    onClick,
    disabled,
  }: {
    "aria-label"?: string;
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button aria-label={ariaLabel} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Popover: {
    Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Trigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Positioner: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Content: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    CloseTrigger: () => null,
    Arrow: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    ArrowTip: () => null,
    Body: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="popover-body">{children}</div>
    ),
  },
  Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Table: {
    Root: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
    Header: ({ children }: { children: React.ReactNode }) => (
      <thead>{children}</thead>
    ),
    Body: ({ children }: { children: React.ReactNode }) => (
      <tbody>{children}</tbody>
    ),
    Row: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
    ColumnHeader: ({ children }: { children: React.ReactNode }) => (
      <th>{children}</th>
    ),
    Cell: ({
      children,
      colSpan,
    }: {
      children?: React.ReactNode;
      colSpan?: number;
    }) => <td colSpan={colSpan}>{children}</td>,
  },
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  VStack: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useFileUpload: () => ({
    acceptedFiles: [],
    clearFiles: vi.fn(),
    setFiles: vi.fn(),
  }),
  useFileUploadContext: () => ({
    acceptedFiles: [],
    clearFiles: vi.fn(),
    setFiles: vi.fn(),
  }),
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

const makeFile = (overrides: object = {}) => ({
  _id: "file1" as unknown as import("../../../../convex/_generated/dataModel").Id<"expensesFiles">,
  _creationTime: new Date("2025-01-15").getTime(),
  userId:
    "user1" as unknown as import("../../../../convex/_generated/dataModel").Id<"users">,
  expenseId:
    "exp1" as unknown as import("../../../../convex/_generated/dataModel").Id<"expenses">,
  storageId: "storage1" as unknown as import("../../../../convex/_generated/dataModel").Id<"_storage">,
  contentType: "image/png",
  filename: "receipt.png",
  size: 1024,
  ...overrides,
});

import ManageExpenseFiles from "./ManageExpenseFiles";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ManageExpenseFiles", () => {
  beforeEach(() => {
    useMutationMock.mockImplementation((key: string) => {
      if (key === "generateUploadUrl") return generateUploadUrlMock;
      if (key === "sendFile") return sendFileMock;
      if (key === "deleteExpenseFile") return deleteFileMock;
      return vi.fn();
    });
    useQueryMock.mockReturnValue(undefined);
  });

  it("renders the Manage Expense Files trigger button", () => {
    render(<ManageExpenseFiles expense={makeExpense()} />);
    expect(
      screen.getByRole("button", { name: "Manage Expense Files" }),
    ).toBeInTheDocument();
  });

  it("renders the dialog title", () => {
    render(<ManageExpenseFiles expense={makeExpense()} />);
    expect(screen.getByText("Manage Expense Files")).toBeInTheDocument();
  });

  it("renders file table headers", () => {
    render(<ManageExpenseFiles expense={makeExpense()} />);
    expect(screen.getByText("Filename")).toBeInTheDocument();
    expect(screen.getByText("Content Type")).toBeInTheDocument();
    expect(screen.getByText("Size")).toBeInTheDocument();
    expect(screen.getByText("Created At")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("renders 'No files uploaded' when files list is empty", () => {
    useQueryMock.mockReturnValue([]);
    render(<ManageExpenseFiles expense={makeExpense()} />);
    expect(
      screen.getByText("No files uploaded for this expense."),
    ).toBeInTheDocument();
  });

  it("renders file rows when files are present", () => {
    useQueryMock.mockImplementation((key: string) => {
      if (key === "getExpenseFiles") return [makeFile()];
      return undefined;
    });
    render(<ManageExpenseFiles expense={makeExpense()} />);
    expect(screen.getByText("receipt.png")).toBeInTheDocument();
    expect(screen.getByText("image/png")).toBeInTheDocument();
  });

  it("renders the Select Files to Upload button", () => {
    render(<ManageExpenseFiles expense={makeExpense()} />);
    expect(
      screen.getByRole("button", { name: /Select Files to Upload/i }),
    ).toBeInTheDocument();
  });

  it("shows the expense name in the dialog body", () => {
    render(<ManageExpenseFiles expense={makeExpense()} />);
    expect(screen.getByText(/Grocery Shopping/)).toBeInTheDocument();
  });

  it("renders Delete File buttons for each file (trigger + confirm per file)", () => {
    useQueryMock.mockImplementation((key: string) => {
      if (key === "getExpenseFiles")
        return [makeFile({ filename: "a.png" }), makeFile({ _id: "file2", filename: "b.pdf" })];
      return undefined;
    });
    render(<ManageExpenseFiles expense={makeExpense()} />);
    // Each file has 2 "Delete File" accessible elements: popover trigger + confirmation button
    const deleteBtns = screen.getAllByRole("button", { name: "Delete File" });
    expect(deleteBtns.length).toBe(4);
  });
});
