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

const { fileUploadState, uploadMock, uploadState, toasterMock } = vi.hoisted(
  () => ({
    fileUploadState: {
      acceptedFiles: [] as File[],
      rejectedFiles: [] as Array<{ file: File; errors: string[] }>,
      clearFiles: vi.fn(),
      options: undefined as Record<string, unknown> | undefined,
    },
    uploadMock: vi.fn(),
    uploadState: { uploading: false },
    toasterMock: { create: vi.fn() },
  }),
);

vi.mock("@chakra-ui/react", () => {
  const Div = ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  );
  return {
    Box: Div,
    HStack: Div,
    Stack: Div,
    Icon: () => null,
    Text: ({ children, role }: { children: React.ReactNode; role?: string }) => (
      <p role={role}>{children}</p>
    ),
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
    Field: { Root: Div, Label: Div },
    NativeSelect: {
      Root: Div,
      Indicator: () => null,
      Field: ({
        children,
        value,
        onChange,
        "aria-label": ariaLabel,
      }: {
        children: React.ReactNode;
        value: string;
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
        "aria-label": string;
      }) => (
        <select aria-label={ariaLabel} value={value} onChange={onChange}>
          {children}
        </select>
      ),
    },
    FileUpload: {
      RootProvider: Div,
      HiddenInput: () => null,
      Dropzone: Div,
      DropzoneContent: Div,
    },
    useFileUpload: (options: Record<string, unknown>) => {
      fileUploadState.options = options;
      return fileUploadState;
    },
  };
});

vi.mock("@tabler/icons-react", () => ({
  IconCloudUpload: () => <span />,
  IconFileTypePdf: () => <span />,
  IconSparkles: () => <span />,
}));

vi.mock("@/components/ui/toaster", () => ({ toaster: toasterMock }));

vi.mock("../hooks/useUploadStatement", () => ({
  default: () => ({ upload: uploadMock, uploading: uploadState.uploading }),
}));

import StatementUploader from "./StatementUploader";

const pdf = new File(["pdf"], "fatura-outubro.pdf", { type: "application/pdf" });

beforeEach(() => {
  fileUploadState.acceptedFiles = [];
  fileUploadState.rejectedFiles = [];
  uploadState.uploading = false;
  uploadMock.mockResolvedValue("statement1");
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("StatementUploader", () => {
  it("accepts a single PDF up to the size limit", () => {
    render(<StatementUploader />);
    expect(fileUploadState.options).toMatchObject({
      maxFiles: 1,
      maxFileSize: 15 * 1024 * 1024,
      accept: ["application/pdf"],
    });
  });

  it("offers Nubank and Inter, defaulting to Nubank", () => {
    render(<StatementUploader />);
    const select = screen.getByRole("combobox", { name: "Card issuer" });
    expect(select).toHaveValue("nubank");
    expect(screen.getByRole("option", { name: "Inter" })).toBeInTheDocument();
  });

  it("hides the analyze button until a file is selected", () => {
    render(<StatementUploader />);
    expect(
      screen.queryByRole("button", { name: /analyze statement/i }),
    ).not.toBeInTheDocument();
  });

  it("uploads the file with the selected issuer and clears it", async () => {
    fileUploadState.acceptedFiles = [pdf];
    render(<StatementUploader />);

    fireEvent.change(screen.getByRole("combobox", { name: "Card issuer" }), {
      target: { value: "inter" },
    });
    fireEvent.click(screen.getByRole("button", { name: /analyze statement/i }));

    await waitFor(() => expect(uploadMock).toHaveBeenCalledWith(pdf, "inter"));
    expect(fileUploadState.clearFiles).toHaveBeenCalled();
    expect(toasterMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: "success", title: "Statement uploaded" }),
    );
  });

  it("shows an error toast and keeps the file when the upload fails", async () => {
    fileUploadState.acceptedFiles = [pdf];
    uploadMock.mockRejectedValueOnce(new Error("Invalid file type"));
    render(<StatementUploader />);

    fireEvent.click(screen.getByRole("button", { name: /analyze statement/i }));

    await waitFor(() =>
      expect(toasterMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          description: "Invalid file type",
        }),
      ),
    );
    expect(fileUploadState.clearFiles).not.toHaveBeenCalled();
  });

  it("explains why a file was rejected", () => {
    fileUploadState.rejectedFiles = [
      { file: new File(["x"], "photo.png"), errors: ["FILE_INVALID_TYPE"] },
    ];
    render(<StatementUploader />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Only PDF statements are accepted.",
    );
  });

  it("disables the actions while uploading", () => {
    fileUploadState.acceptedFiles = [pdf];
    uploadState.uploading = true;
    render(<StatementUploader />);
    expect(screen.getByRole("button", { name: /analyze statement/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();
  });
});
