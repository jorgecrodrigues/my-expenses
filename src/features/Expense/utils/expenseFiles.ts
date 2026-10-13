import type { FileUpload } from "@chakra-ui/react";
import { IconFile, IconFileTypePdf, IconPhoto } from "@tabler/icons-react";
import { MAX_EXPENSE_FILE_SIZE } from "../../../../convex/lib/expenseFileRules";

export function getExpenseFileIcon(contentType: string) {
  if (contentType === "application/pdf") return IconFileTypePdf;
  if (contentType.startsWith("image/")) return IconPhoto;
  return IconFile;
}

export function formatFileUploadedAt(timestamp: number): string {
  return new Date(timestamp).toLocaleString("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Unique per selected file, also across renames (which create a new File). */
export function getSelectedFileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

/**
 * Returns the trimmed new name, re-appending the original extension when the
 * user removed it. Falls back to the original name when the new one is blank.
 */
export function renameKeepingExtension(
  originalName: string,
  nextName: string,
): string {
  const trimmed = nextName.trim();
  if (!trimmed) return originalName;

  const dotIndex = originalName.lastIndexOf(".");
  if (dotIndex <= 0) return trimmed;

  const extension = originalName.slice(dotIndex);
  return trimmed.toLowerCase().endsWith(extension.toLowerCase())
    ? trimmed
    : `${trimmed}${extension}`;
}

const MAX_FILE_SIZE_MB = MAX_EXPENSE_FILE_SIZE / (1024 * 1024);

const FILE_ERROR_MESSAGES: Record<string, string> = {
  TOO_MANY_FILES: "too many files selected at once",
  FILE_INVALID_TYPE: "only images and PDFs are allowed",
  FILE_TOO_LARGE: `larger than ${MAX_FILE_SIZE_MB} MB`,
  FILE_TOO_SMALL: "the file is empty",
  FILE_EXISTS: "already selected",
};

export function describeFileRejection(
  rejection: FileUpload.FileRejection,
): string {
  const reasons = rejection.errors.map(
    (error) => FILE_ERROR_MESSAGES[error] ?? "invalid file",
  );
  return `${rejection.file.name}: ${[...new Set(reasons)].join(", ")}`;
}
