// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const { deleteFileMock, toasterMock } = vi.hoisted(() => ({
  deleteFileMock: vi.fn(),
  toasterMock: { create: vi.fn() },
}));

vi.mock("../../../../convex/_generated/api", () => ({
  api: { expensesfiles: { deleteExpenseFile: "deleteExpenseFile" } },
}));

vi.mock("convex/react", () => ({
  useMutation: () => deleteFileMock,
}));

vi.mock("@/components/ui/toaster", () => ({ toaster: toasterMock }));

vi.mock("@/shared/animation/chakraMotion", () => ({
  popoverContentMotion: {},
}));

vi.mock("@chakra-ui/react", () => {
  const Div = ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  );
  const ButtonStub = ({
    children,
    onClick,
    disabled,
    loading,
    "aria-label": ariaLabel,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
    "aria-label"?: string;
  }) => (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {children}
    </button>
  );
  return {
    Button: ButtonStub,
    IconButton: ButtonStub,
    FormatByte: ({ value }: { value: number }) => <span>{value} B</span>,
    HStack: Div,
    Stack: Div,
    Icon: () => null,
    Spinner: () => <span />,
    Text: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
    Popover: {
      Root: Div,
      Trigger: Div,
      Positioner: Div,
      Content: Div,
      Arrow: Div,
      ArrowTip: () => null,
      Body: Div,
    },
    Table: {
      ScrollArea: Div,
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
  };
});

vi.mock("@tabler/icons-react", () => ({
  IconDownload: () => <span />,
  IconTrash: () => <span />,
  IconFile: () => <span />,
  IconFileTypePdf: () => <span />,
  IconPhoto: () => <span />,
}));

import type { Id } from "../../../../convex/_generated/dataModel";
import ExpenseFilesTable, { type ExpenseFileWithUrl } from "./ExpenseFilesTable";

function makeFile(
  overrides: Partial<ExpenseFileWithUrl> = {},
): ExpenseFileWithUrl {
  return {
    _id: "file1" as Id<"expensesFiles">,
    _creationTime: new Date(2026, 9, 13, 18, 14).getTime(),
    userId: "user1" as Id<"users">,
    expenseId: "exp1" as Id<"expenses">,
    storageId: "storage1" as Id<"_storage">,
    filename: "receipt.pdf",
    contentType: "application/pdf",
    size: 2048,
    url: "https://files.example/receipt",
    ...overrides,
  };
}

beforeEach(() => {
  deleteFileMock.mockResolvedValue(null);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ExpenseFilesTable", () => {
  it("shows a loading state while files are undefined", () => {
    render(<ExpenseFilesTable files={undefined} />);
    expect(screen.getByText("Loading files...")).toBeInTheDocument();
  });

  it("shows an empty state when there are no files", () => {
    render(<ExpenseFilesTable files={[]} />);
    expect(
      screen.getByText("No files uploaded for this expense."),
    ).toBeInTheDocument();
  });

  it("renders a row per file with its details", () => {
    render(<ExpenseFilesTable files={[makeFile()]} />);

    expect(screen.getByText("receipt.pdf", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText(/application\/pdf/)).toHaveTextContent(
      "application/pdf · 2048 B",
    );
    expect(
      screen.getByRole("button", { name: "Download receipt.pdf" }),
    ).toBeEnabled();
  });

  it("disables the download when the file has no URL", () => {
    render(<ExpenseFilesTable files={[makeFile({ url: null })]} />);
    expect(
      screen.getByRole("button", { name: "Download receipt.pdf" }),
    ).toBeDisabled();
  });

  it("downloads the file with its original name", async () => {
    const blob = new Blob(["pdf"]);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => blob,
    });
    vi.stubGlobal("fetch", fetchMock);
    const createObjectURL = vi.fn(() => "blob:receipt");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal(
      "URL",
      class extends URL {
        static createObjectURL = createObjectURL;
        static revokeObjectURL = revokeObjectURL;
      },
    );
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        expect(this.download).toBe("receipt.pdf");
        expect(this.href).toBe("blob:receipt");
      });

    render(<ExpenseFilesTable files={[makeFile()]} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Download receipt.pdf" }),
    );

    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith("blob:receipt"));
    expect(fetchMock).toHaveBeenCalledWith("https://files.example/receipt");
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(click).toHaveBeenCalled();
    expect(toasterMock.create).not.toHaveBeenCalled();
  });

  it("shows a single error toast when the download fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, statusText: "Not Found" }),
    );

    render(<ExpenseFilesTable files={[makeFile()]} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Download receipt.pdf" }),
    );

    await waitFor(() => expect(toasterMock.create).toHaveBeenCalledTimes(1));
    expect(toasterMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: "error", title: "Download failed" }),
    );
  });

  it("deletes the file after confirming", async () => {
    render(<ExpenseFilesTable files={[makeFile()]} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete file" }));

    await waitFor(() =>
      expect(deleteFileMock).toHaveBeenCalledWith({ fileId: "file1" }),
    );
    expect(toasterMock.create).not.toHaveBeenCalled();
  });

  it("shows an error toast when deleting fails", async () => {
    deleteFileMock.mockRejectedValueOnce(new Error("Unauthorized"));
    render(<ExpenseFilesTable files={[makeFile()]} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete file" }));

    await waitFor(() =>
      expect(toasterMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error", title: "Delete failed" }),
      ),
    );
  });
});
