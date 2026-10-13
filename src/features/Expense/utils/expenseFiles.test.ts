import { describe, expect, it } from "vitest";
import { IconFile, IconFileTypePdf, IconPhoto } from "@tabler/icons-react";
import {
  describeFileRejection,
  formatFileUploadedAt,
  getExpenseFileIcon,
  getSelectedFileKey,
  renameKeepingExtension,
} from "./expenseFiles";

describe("getExpenseFileIcon", () => {
  it("picks an icon by content type", () => {
    expect(getExpenseFileIcon("application/pdf")).toBe(IconFileTypePdf);
    expect(getExpenseFileIcon("image/png")).toBe(IconPhoto);
    expect(getExpenseFileIcon("text/plain")).toBe(IconFile);
    expect(getExpenseFileIcon("")).toBe(IconFile);
  });
});

describe("formatFileUploadedAt", () => {
  it("formats the timestamp with date and time", () => {
    const timestamp = new Date(2026, 9, 13, 18, 14).getTime();
    expect(formatFileUploadedAt(timestamp)).toBe(
      new Date(timestamp).toLocaleString("pt-BR", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    );
  });
});

describe("getSelectedFileKey", () => {
  it("differs for files with the same name but different content", () => {
    const a = new File(["a"], "doc.pdf", { lastModified: 1 });
    const b = new File(["bb"], "doc.pdf", { lastModified: 1 });
    expect(getSelectedFileKey(a)).not.toBe(getSelectedFileKey(b));
  });
});

describe("renameKeepingExtension", () => {
  it("keeps a new name that already has the extension", () => {
    expect(renameKeepingExtension("scan.png", "receipt.png")).toBe(
      "receipt.png",
    );
  });

  it("re-appends the original extension when it was removed", () => {
    expect(renameKeepingExtension("scan.png", "receipt")).toBe("receipt.png");
  });

  it("compares extensions case-insensitively", () => {
    expect(renameKeepingExtension("scan.PDF", "receipt.pdf")).toBe(
      "receipt.pdf",
    );
  });

  it("trims whitespace", () => {
    expect(renameKeepingExtension("scan.png", "  receipt.png  ")).toBe(
      "receipt.png",
    );
  });

  it("falls back to the original name when blank", () => {
    expect(renameKeepingExtension("scan.png", "   ")).toBe("scan.png");
  });

  it("does not add an extension when the original had none", () => {
    expect(renameKeepingExtension("README", "notes")).toBe("notes");
    expect(renameKeepingExtension(".env", "config")).toBe("config");
  });
});

describe("describeFileRejection", () => {
  const file = new File(["x"], "big.zip");

  it("lists readable reasons with the file name", () => {
    expect(
      describeFileRejection({
        file,
        errors: ["FILE_INVALID_TYPE", "FILE_TOO_LARGE"],
      }),
    ).toBe("big.zip: only images and PDFs are allowed, larger than 10 MB");
  });

  it("uses a generic reason for unknown errors and removes duplicates", () => {
    expect(
      describeFileRejection({ file, errors: ["SOMETHING", "OTHER"] }),
    ).toBe("big.zip: invalid file");
  });
});
