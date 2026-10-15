import type { CreditCardIssuer } from "./creditCardValidators";

/** Max size of a statement PDF, enforced on the client and the server. */
export const MAX_STATEMENT_FILE_SIZE = 15 * 1024 * 1024;

export const STATEMENT_CONTENT_TYPE = "application/pdf";

export const CREDIT_CARD_ISSUERS: { value: CreditCardIssuer; label: string }[] =
  [
    { value: "nubank", label: "Nubank" },
    { value: "inter", label: "Inter" },
  ];

export const CREDIT_CARD_CATEGORIES = [
  "food",
  "groceries",
  "transport",
  "fuel",
  "health",
  "education",
  "entertainment",
  "subscriptions",
  "shopping",
  "travel",
  "home",
  "services",
  "fees",
  "other",
] as const;

export type CreditCardCategory = (typeof CREDIT_CARD_CATEGORIES)[number];

export const FALLBACK_CATEGORY: CreditCardCategory = "other";

export const INVALID_STATEMENT_MESSAGE =
  "The file is not a valid PDF. Download the statement again and upload the new copy.";

export const ENCRYPTED_STATEMENT_MESSAGE =
  "This PDF is password-protected. Open it with the password, save an unprotected copy (File > Print > Save as PDF) and upload that copy.";

/**
 * Password-protected PDFs carry an /Encrypt entry in their trailer or
 * cross-reference stream, which is never compressed. Gemini rejects them.
 */
export function isEncryptedPdf(bytes: Uint8Array): boolean {
  return /\/Encrypt\b/.test(new TextDecoder("latin1").decode(bytes));
}

/**
 * Some downloads come with junk (e.g. zero padding) before the %PDF- header.
 * PDF offsets are relative to the header, so dropping the prefix yields a
 * valid file; Gemini rejects the untrimmed one with "invalid argument".
 */
export function trimToPdfHeader(bytes: Uint8Array): Uint8Array | null {
  const offset = new TextDecoder("latin1").decode(bytes).indexOf("%PDF-");
  return offset < 0 ? null : bytes.subarray(offset);
}

export function isStatementContentType(contentType: string): boolean {
  return contentType === STATEMENT_CONTENT_TYPE;
}

export function isCreditCardCategory(
  value: string,
): value is CreditCardCategory {
  return (CREDIT_CARD_CATEGORIES as readonly string[]).includes(value);
}

export const MAX_CATEGORY_NAME_LENGTH = 40;

/**
 * Maps a typed category name to the stored one, matching built-in and
 * existing custom categories case-insensitively so "Food" and "food" don't
 * become two categories.
 *
 * @returns The category to store and whether it is a new custom one.
 */
export function resolveCategoryName(
  input: string,
  customCategories: readonly string[],
): { category: string; isNew: boolean } {
  const name = input.trim().replace(/\s+/g, " ");
  if (!name) {
    throw new Error("Category name is required");
  }
  if (name.length > MAX_CATEGORY_NAME_LENGTH) {
    throw new Error(
      `Category name must be at most ${MAX_CATEGORY_NAME_LENGTH} characters`,
    );
  }
  const key = name.toLowerCase();
  const existing = [...CREDIT_CARD_CATEGORIES, ...customCategories].find(
    (category) => category.toLowerCase() === key,
  );
  return existing
    ? { category: existing, isNew: false }
    : { category: name, isNew: true };
}
