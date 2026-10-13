// @vitest-environment jsdom
import React from "react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const { fileUploadState, uploadState, toasterMock } = vi.hoisted(() => ({
  fileUploadState: {
    current: {
      acceptedFiles: [] as File[],
      rejectedFiles: [] as Array<{ file: File; errors: string[] }>,
      setFiles: (() => {}) as (files: File[]) => void,
      clearFiles: (() => {}) as () => void,
      clearRejectedFiles: (() => {}) as () => void,
    },
    options: undefined as Record<string, unknown> | undefined,
  },
  uploadState: {
    current: {
      upload: (async () => ({ uploaded: [], failed: [] })) as (
        files: File[],
      ) => Promise<{ uploaded: File[]; failed: File[] }>,
      uploading: false,
    },
    expenseId: undefined as string | undefined,
  },
  toasterMock: { create: () => {} },
}));

vi.mock("@chakra-ui/react", () => {
  const Div = ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  );
  return {
    Box: Div,
    HStack: Div,
    Icon: () => null,
    Stack: ({
      children,
      role,
    }: {
      children: React.ReactNode;
      role?: string;
    }) => <div role={role}>{children}</div>,
    Text: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
    Button: ({
      children,
      onClick,
      disabled,
      loading,
    }: {
      children: React.ReactNode;
      onClick?: () => void;
      disabled?: boolean;
      loading?: boolean;
    }) => (
      <button type="button" onClick={onClick} disabled={disabled || loading}>
        {children}
      </button>
    ),
    IconButton: ({
      children,
      "aria-label": ariaLabel,
      disabled,
    }: {
      children: React.ReactNode;
      "aria-label": string;
      disabled?: boolean;
    }) => (
      <button type="button" aria-label={ariaLabel} disabled={disabled}>
        {children}
      </button>
    ),
    Editable: {
      Root: ({
        children,
        defaultValue,
        onValueCommit,
      }: {
        children: React.ReactNode;
        defaultValue: string;
        onValueCommit: (details: { value: string }) => void;
      }) => (
        <div>
          <input
            aria-label={`Rename ${defaultValue}`}
            defaultValue={defaultValue}
            onBlur={(e) => onValueCommit({ value: e.target.value })}
          />
          {children}
        </div>
      ),
      Preview: () => null,
      Input: () => null,
    },
    FileUpload: {
      RootProvider: Div,
      HiddenInput: () => null,
      Dropzone: Div,
      DropzoneContent: Div,
      ItemGroup: ({ children }: { children: React.ReactNode }) => (
        <ul>{children}</ul>
      ),
      Item: ({ children }: { children: React.ReactNode }) => (
        <li>{children}</li>
      ),
      ItemSizeText: () => null,
      ItemDeleteTrigger: Div,
    },
    useFileUpload: (options: Record<string, unknown>) => {
      fileUploadState.options = options;
      return fileUploadState.current;
    },
  };
});

vi.mock("@tabler/icons-react", () => ({
  IconCloudUpload: () => <span />,
  IconUpload: () => <span />,
  IconX: () => <span />,
  IconFile: () => <span />,
  IconFileTypePdf: () => <span />,
  IconPhoto: () => <span />,
}));

vi.mock("@/components/ui/toaster", () => ({ toaster: toasterMock }));

vi.mock("../hooks/useUploadExpenseFiles", () => ({
  default: (expenseId: string) => {
    uploadState.expenseId = expenseId;
    return uploadState.current;
  },
}));

import type { Id } from "../../../../convex/_generated/dataModel";
import ExpenseFileUploader from "./ExpenseFileUploader";

const expenseId = "exp1" as Id<"expenses">;
const pdf = new File(["pdf"], "invoice.pdf", { type: "application/pdf" });
const png = new File(["png"], "receipt.png", { type: "image/png" });

let setFiles: Mock<(files: File[]) => void>;
let clearFiles: Mock<() => void>;
let upload: Mock<
  (files: File[]) => Promise<{ uploaded: File[]; failed: File[] }>
>;

beforeEach(() => {
  setFiles = vi.fn<(files: File[]) => void>();
  clearFiles = vi.fn<() => void>();
  upload = vi.fn(async (files: File[]) => ({
    uploaded: files,
    failed: [] as File[],
  }));
  fileUploadState.current = {
    acceptedFiles: [],
    rejectedFiles: [],
    setFiles,
    clearFiles,
    clearRejectedFiles: vi.fn(),
  };
  uploadState.current = { upload, uploading: false };
  toasterMock.create = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ExpenseFileUploader", () => {
  it("configures the upload limits and the target expense", () => {
    render(<ExpenseFileUploader expenseId={expenseId} />);

    expect(fileUploadState.options).toMatchObject({
      maxFiles: 10,
      maxFileSize: 10 * 1024 * 1024,
      accept: ["image/*", "application/pdf"],
    });
    expect(uploadState.expenseId).toBe("exp1");
    expect(
      screen.getByText("Drag and drop files here, or click to browse"),
    ).toBeInTheDocument();
  });

  it("hides the upload actions while nothing is selected", () => {
    render(<ExpenseFileUploader expenseId={expenseId} />);
    expect(
      screen.queryByRole("button", { name: /upload/i }),
    ).not.toBeInTheDocument();
  });

  it("lists the selected files with the upload count", () => {
    fileUploadState.current.acceptedFiles = [pdf, png];
    render(<ExpenseFileUploader expenseId={expenseId} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "Remove invoice.pdf" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upload 2 files" }),
    ).toBeInTheDocument();
  });

  it("shows why files were rejected", () => {
    fileUploadState.current.rejectedFiles = [
      { file: new File(["x"], "archive.zip"), errors: ["FILE_INVALID_TYPE"] },
    ];
    render(<ExpenseFileUploader expenseId={expenseId} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "archive.zip: only images and PDFs are allowed",
    );
  });

  it("uploads the selected files and clears them on success", async () => {
    fileUploadState.current.acceptedFiles = [pdf];
    render(<ExpenseFileUploader expenseId={expenseId} />);

    fireEvent.click(screen.getByRole("button", { name: "Upload 1 file" }));

    await waitFor(() => expect(clearFiles).toHaveBeenCalled());
    expect(upload).toHaveBeenCalledWith([pdf]);
    expect(toasterMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: "success", title: "1 file uploaded" }),
    );
  });

  it("keeps only the failed files selected for a retry", async () => {
    upload.mockResolvedValue({ uploaded: [png], failed: [pdf] });
    fileUploadState.current.acceptedFiles = [pdf, png];
    render(<ExpenseFileUploader expenseId={expenseId} />);

    fireEvent.click(screen.getByRole("button", { name: "Upload 2 files" }));

    await waitFor(() => expect(setFiles).toHaveBeenCalledWith([pdf]));
    expect(clearFiles).not.toHaveBeenCalled();
    expect(toasterMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: "error", title: "Upload failed" }),
    );
  });

  it("clears the selection", () => {
    fileUploadState.current.acceptedFiles = [pdf];
    render(<ExpenseFileUploader expenseId={expenseId} />);

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(clearFiles).toHaveBeenCalled();
  });

  it("disables the actions while uploading", () => {
    uploadState.current.uploading = true;
    fileUploadState.current.acceptedFiles = [pdf];
    render(<ExpenseFileUploader expenseId={expenseId} />);

    expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Remove invoice.pdf" }),
    ).toBeDisabled();
    expect(fileUploadState.options).toMatchObject({ disabled: true });
  });

  it("renames a file keeping its extension", () => {
    fileUploadState.current.acceptedFiles = [pdf, png];
    render(<ExpenseFileUploader expenseId={expenseId} />);

    const input = screen.getByRole("textbox", { name: "Rename invoice.pdf" });
    fireEvent.change(input, { target: { value: "march" } });
    fireEvent.blur(input);

    const [renamed, untouched] = setFiles.mock.calls[0][0] as File[];
    expect(renamed.name).toBe("march.pdf");
    expect(renamed.type).toBe("application/pdf");
    expect(untouched).toBe(png);
  });

  it("ignores a rename that keeps the same name", () => {
    fileUploadState.current.acceptedFiles = [pdf];
    render(<ExpenseFileUploader expenseId={expenseId} />);

    fireEvent.blur(screen.getByRole("textbox", { name: "Rename invoice.pdf" }));
    expect(setFiles).not.toHaveBeenCalled();
  });
});
