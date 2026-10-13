/** Max size of a single expense file, enforced on the client and the server. */
export const MAX_EXPENSE_FILE_SIZE = 10 * 1024 * 1024;

/** Max number of files selected for a single upload. */
export const MAX_EXPENSE_FILES_PER_UPLOAD = 10;

/** MIME patterns accepted as expense files (receipts, invoices). */
export const ACCEPTED_EXPENSE_FILE_TYPES = ["image/*", "application/pdf"];

export function isAcceptedExpenseFileType(contentType: string): boolean {
  return ACCEPTED_EXPENSE_FILE_TYPES.some((pattern) =>
    pattern.endsWith("/*")
      ? contentType.startsWith(pattern.slice(0, -1))
      : contentType === pattern,
  );
}
