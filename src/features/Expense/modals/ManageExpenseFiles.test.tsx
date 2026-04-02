// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

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

const generateUploadUrlMock = vi.fn().mockResolvedValue("https://upload.example/upload");
const sendFileMock = vi.fn().mockResolvedValue(undefined);
const deleteFileMock = vi.fn().mockResolvedValue(undefined);

vi.mock("convex/react", () => ({
  useMutation: (fn: string) => {
    if (fn === "generateUploadUrl") return generateUploadUrlMock;
    if (fn === "sendFile") return sendFileMock;
    if (fn === "deleteExpenseFile") return deleteFileMock;
    return vi.fn().mockResolvedValue(undefined);
  },
  useQuery: vi.fn(),
}));

vi.mock("@/components/ui/toaster", () => ({
  toaster: { create: vi.fn() },
}));

vi.mock("@/shared/animation/chakraMotion", () => ({
  dialogBackdropMotion: {},
  dialogContentMotion: {},
  popoverContentMotion: {},
}));

const mockFileUpload = {
  acceptedFiles: [] as File[],
  clearFiles: vi.fn(),
  setFiles: vi.fn(),
};

vi.mock("@chakra-ui/react", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    loading,
    display,
  }: {
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    disabled?: boolean;
    loading?: boolean;
    display?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      data-loading={loading ? "true" : "false"}
      style={{ display: display === "none" ? "none" : "flex" }}
    >
      {children}
    </button>
  ),
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
    CloseTrigger: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  },
  Editable: {
    Root: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    Preview: () => null,
    Input: () => null,
  },
  FileUpload: {
    RootProvider: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="file-upload-root">{children}</div>
    ),
    HiddenInput: () => <input data-testid="file-hidden" type="file" />,
    Trigger: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    ItemGroup: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    Item: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    ItemSizeText: () => null,
    ItemDeleteTrigger: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  },
  FormatByte: ({ value }: { value: number }) => <span>{value} B</span>,
  HStack: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Icon: () => null,
  IconButton: ({
    "aria-label": ariaLabel,
    children,
    onClick,
    disabled,
    loading,
  }: {
    "aria-label"?: string;
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
  }) => (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {children}
    </button>
  ),
  Popover: {
    Root: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    Trigger: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    Positioner: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    Content: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    CloseTrigger: () => null,
    Arrow: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    ArrowTip: () => null,
    Body: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  },
  Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Table: {
    Root: ({ children }: { children: React.ReactNode }) => (
      <table>{children}</table>
    ),
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
      children: React.ReactNode;
      colSpan?: number;
    }) => <td colSpan={colSpan}>{children}</td>,
  },
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  VStack: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useFileUpload: () => mockFileUpload,
  useFileUploadContext: () => mockFileUpload,
}));

vi.mock("@tabler/icons-react", () => ({
  IconArchiveFilled: () => null,
  IconDownload: () => null,
  IconFiles: () => null,
  IconTrash: () => null,
  IconUpload: () => null,
}));

import { useQuery } from "convex/react";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import ManageExpenseFiles from "./ManageExpenseFiles";

function makeExpense(overrides: Partial<Doc<"expenses">> = {}): Doc<"expenses"> {
  return {
    _id: "exp1" as Id<"expenses">,
    _creationTime: Date.now(),
    userId: "user1" as Id<"users">,
    name: "Invoice A",
    description: "Office",
    amount: 200,
    category: "Office",
    date: "2025-05-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeExpenseFile(
  overrides: Partial<Doc<"expensesFiles">> = {},
): Doc<"expensesFiles"> {
  return {
    _id: "file1" as Id<"expensesFiles">,
    _creationTime: new Date("2025-05-02T12:00:00Z").getTime(),
    userId: "user1" as Id<"users">,
    storageId: "k123storage" as Id<"_storage">,
    expenseId: "exp1" as Id<"expenses">,
    filename: "receipt.pdf",
    contentType: "application/pdf",
    size: 2048,
    ...overrides,
  };
}

beforeEach(() => {
  vi.mocked(useQuery).mockImplementation(
    ((query: unknown) => {
      if (query === "getExpenseFiles") return [];
      if (query === "getUrl") return null;
      return undefined;
    }) as typeof useQuery,
  );
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  mockFileUpload.acceptedFiles = [];
});

describe("ManageExpenseFiles", () => {
  it("renders the manage files trigger button", () => {
    render(<ManageExpenseFiles expense={makeExpense()} />);
    expect(
      screen.getByRole("button", { name: "Manage Expense Files" }),
    ).toBeInTheDocument();
  });

  it("shows the dialog title and expense name in the body", () => {
    render(<ManageExpenseFiles expense={makeExpense()} />);
    expect(screen.getByText("Manage Expense Files")).toBeInTheDocument();
    expect(screen.getByText("Invoice A", { exact: false })).toBeInTheDocument();
  });

  it("shows empty files message when there are no files", () => {
    render(<ManageExpenseFiles expense={makeExpense()} />);
    expect(
      screen.getByText("No files uploaded for this expense."),
    ).toBeInTheDocument();
  });

  it("renders file rows when files exist", () => {
    vi.mocked(useQuery).mockImplementation(
      ((query: unknown) => {
        if (query === "getExpenseFiles") return [makeExpenseFile()];
        if (query === "getUrl") return null;
        return undefined;
      }) as typeof useQuery,
    );

    render(<ManageExpenseFiles expense={makeExpense()} />);

    expect(screen.getByText("receipt.pdf")).toBeInTheDocument();
    expect(screen.getByText("application/pdf")).toBeInTheDocument();
    expect(screen.getByText("2048 B")).toBeInTheDocument();
  });

  it("calls deleteExpenseFile when confirming delete in the popover", () => {
    vi.mocked(useQuery).mockImplementation(
      ((query: unknown) => {
        if (query === "getExpenseFiles") return [makeExpenseFile()];
        if (query === "getUrl") return null;
        return undefined;
      }) as typeof useQuery,
    );

    render(<ManageExpenseFiles expense={makeExpense()} />);

    const deleteButtons = screen.getAllByRole("button", { name: "Delete File" });
    fireEvent.click(deleteButtons[deleteButtons.length - 1]);

    expect(deleteFileMock).toHaveBeenCalledWith({ fileId: "file1" });
  });

  it("uploads accepted files and calls sendFile after posting to the upload URL", async () => {
    mockFileUpload.acceptedFiles = [
      new File(["hello"], "doc.pdf", { type: "application/pdf" }),
    ];

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ storageId: "stor1" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ManageExpenseFiles expense={makeExpense()} />);

    fireEvent.click(screen.getByRole("button", { name: /upload files/i }));

    await waitFor(() => {
      expect(generateUploadUrlMock).toHaveBeenCalled();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://upload.example/upload",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/pdf" },
      }),
    );
    expect(sendFileMock).toHaveBeenCalledWith(
      expect.objectContaining({
        storageId: "stor1",
        userId: "user1",
        expenseId: "exp1",
        filename: "doc.pdf",
        contentType: "application/pdf",
        size: expect.any(Number),
      }),
    );
    expect(mockFileUpload.clearFiles).toHaveBeenCalled();
  });
});
