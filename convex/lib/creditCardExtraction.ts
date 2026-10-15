import {
  CREDIT_CARD_CATEGORIES,
  FALLBACK_CATEGORY,
  isCreditCardCategory,
  type CreditCardCategory,
} from "./creditCardRules";
import type {
  CreditCardIssuer,
  CreditCardTransactionType,
} from "./creditCardValidators";

const TRANSACTION_TYPES: readonly CreditCardTransactionType[] = [
  "purchase",
  "refund",
  "fee",
  "iof",
  "interest",
  "payment",
];

/** Types whose amount always reduces the statement balance. */
const CREDIT_TYPES: readonly CreditCardTransactionType[] = ["refund", "payment"];

/** JSON schema the Gemini response must follow. Amounts are in BRL (reais). */
export const STATEMENT_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    referenceMonth: {
      type: "string",
      description:
        "Month the statement refers to, in YYYY-MM format (usually the due date month).",
    },
    closingDate: {
      type: "string",
      description: "Statement closing date, YYYY-MM-DD.",
    },
    dueDate: { type: "string", description: "Payment due date, YYYY-MM-DD." },
    totalAmount: {
      type: "number",
      description: "Total amount to pay on this statement, in BRL.",
    },
    cardLastDigits: {
      type: "string",
      description: "Last 4 digits of the card, when printed.",
    },
    transactions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "Transaction date, YYYY-MM-DD.",
          },
          description: {
            type: "string",
            description: "Line description exactly as printed.",
          },
          merchant: {
            type: "string",
            description:
              "Clean merchant name without installment markers or city, e.g. 'iFood'.",
          },
          amount: {
            type: "number",
            description:
              "Amount in BRL. Positive for charges, negative for refunds, credits and payments.",
          },
          category: { type: "string", enum: [...CREDIT_CARD_CATEGORIES] },
          type: { type: "string", enum: [...TRANSACTION_TYPES] },
          installmentCurrent: {
            type: "integer",
            description: "Current installment number, e.g. 3 in '3/10'.",
          },
          installmentTotal: {
            type: "integer",
            description: "Total installments, e.g. 10 in '3/10'.",
          },
          isInternational: { type: "boolean" },
          originalCurrency: {
            type: "string",
            description: "ISO currency code for international purchases.",
          },
          originalAmount: {
            type: "number",
            description: "Amount in the original currency.",
          },
        },
        required: ["date", "description", "amount", "category", "type"],
      },
    },
  },
  required: ["referenceMonth", "totalAmount", "transactions"],
} as const;

const ISSUER_HINTS: Record<CreditCardIssuer, string> = {
  nubank: [
    "This is a Nubank (Nu Pagamentos) credit card statement.",
    "Transactions are listed under 'TRANSAÇÕES' with dates like '12 OUT'.",
    "Installments appear as 'Parcela 3/10' or '- 3/10' after the description.",
    "International purchases show the original currency and a separate 'IOF de compra internacional' line.",
    "'Pagamento recebido' / 'Pagamento em' lines are payments of the previous statement.",
  ].join("\n"),
  inter: [
    "This is a Banco Inter credit card statement.",
    "Transactions are grouped per card ('Cartão final XXXX') with dates like '12/10/2026'.",
    "Installments appear as '(Parcela 03 de 10)' or '3/10'.",
    "International purchases and 'IOF' appear as separate lines.",
    "'Pagamento on line' / 'Pagto' lines are payments of the previous statement.",
  ].join("\n"),
};

export function buildExtractionPrompt(issuer: CreditCardIssuer): string {
  return [
    "You extract data from Brazilian credit card statements (faturas) in PDF.",
    ISSUER_HINTS[issuer],
    "Rules:",
    "- Return every transaction line of the statement period, including fees, IOF, interest, refunds and payments.",
    "- Do not include summary lines such as 'Total', 'Saldo anterior' or future installment previews.",
    "- Dates must be YYYY-MM-DD; infer the year from the statement closing date.",
    "- Amounts are in BRL with '.' as decimal separator (convert '1.234,56' to 1234.56).",
    `- category must be one of: ${CREDIT_CARD_CATEGORIES.join(", ")}.`,
    "- Use type 'iof' for IOF lines, 'interest' for juros/multa/encargos, 'fee' for anuidade and other bank fees.",
  ].join("\n");
}

export interface ExtractedTransaction {
  date: string;
  description: string;
  merchant?: string;
  amountCents: number;
  category: CreditCardCategory;
  type: CreditCardTransactionType;
  installmentCurrent?: number;
  installmentTotal?: number;
  isInternational?: boolean;
  originalCurrency?: string;
  originalAmount?: number;
}

export interface ExtractedStatement {
  referenceMonth: string;
  closingDate?: string;
  dueDate?: string;
  totalAmountCents: number;
  cardLastDigits?: string;
  transactions: ExtractedTransaction[];
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function optionalPositiveInt(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : undefined;
}

function optionalFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/** Accepts YYYY-MM-DD or DD/MM/YYYY and returns YYYY-MM-DD, or undefined. */
export function normalizeDate(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  const [year, month, day] = iso
    ? [iso[1], iso[2], iso[3]]
    : br
      ? [br[3], br[2], br[1]]
      : [];
  if (!year || !month || !day) return undefined;
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  if (monthNumber < 1 || monthNumber > 12 || dayNumber < 1 || dayNumber > 31) {
    return undefined;
  }
  return `${year}-${month}-${day}`;
}

export function normalizeReferenceMonth(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const match = /^(\d{4})-(\d{2})/.exec(value.trim());
  if (!match) return undefined;
  const month = Number(match[2]);
  return month >= 1 && month <= 12 ? `${match[1]}-${match[2]}` : undefined;
}

function parseTransaction(raw: unknown): ExtractedTransaction | null {
  if (!isRecord(raw)) return null;
  const date = normalizeDate(raw.date);
  const description = optionalString(raw.description);
  const amount = optionalFiniteNumber(raw.amount);
  if (!date || !description || amount === undefined) return null;

  const type: CreditCardTransactionType =
    typeof raw.type === "string" &&
    (TRANSACTION_TYPES as readonly string[]).includes(raw.type)
      ? (raw.type as CreditCardTransactionType)
      : "purchase";
  const category =
    typeof raw.category === "string" && isCreditCardCategory(raw.category)
      ? raw.category
      : FALLBACK_CATEGORY;

  const cents = toCents(amount);
  const amountCents = CREDIT_TYPES.includes(type) ? -Math.abs(cents) : cents;

  const installmentCurrent = optionalPositiveInt(raw.installmentCurrent);
  const installmentTotal = optionalPositiveInt(raw.installmentTotal);
  const hasInstallments =
    installmentCurrent !== undefined &&
    installmentTotal !== undefined &&
    installmentTotal > 1 &&
    installmentCurrent <= installmentTotal;

  const originalCurrency = optionalString(raw.originalCurrency)?.toUpperCase();

  return {
    date,
    description,
    merchant: optionalString(raw.merchant),
    amountCents,
    category,
    type,
    installmentCurrent: hasInstallments ? installmentCurrent : undefined,
    installmentTotal: hasInstallments ? installmentTotal : undefined,
    isInternational:
      raw.isInternational === true ||
      (originalCurrency !== undefined && originalCurrency !== "BRL")
        ? true
        : undefined,
    originalCurrency:
      originalCurrency && originalCurrency !== "BRL"
        ? originalCurrency
        : undefined,
    originalAmount:
      originalCurrency && originalCurrency !== "BRL"
        ? optionalFiniteNumber(raw.originalAmount)
        : undefined,
  };
}

/**
 * Validates and normalizes the JSON returned by Gemini. Malformed transaction
 * lines are dropped; a malformed statement header throws.
 */
export function parseExtraction(raw: unknown): ExtractedStatement {
  if (!isRecord(raw)) {
    throw new Error("The AI response is not a JSON object");
  }
  const referenceMonth = normalizeReferenceMonth(raw.referenceMonth);
  if (!referenceMonth) {
    throw new Error("Could not identify the statement reference month");
  }
  const totalAmount = optionalFiniteNumber(raw.totalAmount);
  if (totalAmount === undefined) {
    throw new Error("Could not identify the statement total amount");
  }
  if (!Array.isArray(raw.transactions)) {
    throw new Error("The AI response has no transaction list");
  }

  const transactions = raw.transactions
    .map(parseTransaction)
    .filter((transaction): transaction is ExtractedTransaction =>
      transaction !== null,
    );
  if (transactions.length === 0) {
    throw new Error("No transactions were found in the statement");
  }

  const digits = optionalString(raw.cardLastDigits)?.replace(/\D/g, "");

  return {
    referenceMonth,
    closingDate: normalizeDate(raw.closingDate),
    dueDate: normalizeDate(raw.dueDate),
    totalAmountCents: toCents(totalAmount),
    cardLastDigits: digits ? digits.slice(-4) : undefined,
    transactions,
  };
}

/** Sum of the statement lines, ignoring payments of the previous statement. */
export function sumStatementCents(
  transactions: Pick<ExtractedTransaction, "amountCents" | "type">[],
): number {
  return transactions
    .filter((transaction) => transaction.type !== "payment")
    .reduce((sum, transaction) => sum + transaction.amountCents, 0);
}
