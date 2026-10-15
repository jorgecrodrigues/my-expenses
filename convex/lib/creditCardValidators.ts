import { v, type Infer } from "convex/values";

export const creditCardIssuerValidator = v.union(
  v.literal("nubank"),
  v.literal("inter"),
);

export const creditCardStatementStatusValidator = v.union(
  v.literal("pending"),
  v.literal("processing"),
  v.literal("completed"),
  v.literal("failed"),
);

export const creditCardTransactionTypeValidator = v.union(
  v.literal("purchase"),
  v.literal("refund"),
  v.literal("fee"),
  v.literal("iof"),
  v.literal("interest"),
  v.literal("payment"),
);

/** Fields extracted from the statement header. */
export const creditCardStatementExtractedFields = {
  referenceMonth: v.optional(v.string()),
  closingDate: v.optional(v.string()),
  dueDate: v.optional(v.string()),
  totalAmountCents: v.optional(v.number()),
  cardLastDigits: v.optional(v.string()),
};

export const creditCardStatementFields = {
  userId: v.id("users"),
  issuer: creditCardIssuerValidator,
  storageId: v.id("_storage"),
  filename: v.string(),
  status: creditCardStatementStatusValidator,
  errorMessage: v.optional(v.string()),
  ...creditCardStatementExtractedFields,
  extractedSumCents: v.optional(v.number()),
  aiSummary: v.optional(v.string()),
};

/** Fields of one statement line, as extracted by the AI. */
export const creditCardTransactionExtractedFields = {
  date: v.string(),
  description: v.string(),
  merchant: v.optional(v.string()),
  amountCents: v.number(),
  category: v.string(),
  type: creditCardTransactionTypeValidator,
  installmentCurrent: v.optional(v.number()),
  installmentTotal: v.optional(v.number()),
  isInternational: v.optional(v.boolean()),
  originalCurrency: v.optional(v.string()),
  originalAmount: v.optional(v.number()),
};

export const creditCardTransactionFields = {
  userId: v.id("users"),
  statementId: v.id("creditCardStatements"),
  ...creditCardTransactionExtractedFields,
};

export const creditCardStatementValidator = v.object({
  _id: v.id("creditCardStatements"),
  _creationTime: v.number(),
  ...creditCardStatementFields,
});

export const creditCardTransactionValidator = v.object({
  _id: v.id("creditCardTransactions"),
  _creationTime: v.number(),
  ...creditCardTransactionFields,
});

const totalValidator = { totalCents: v.number(), count: v.number() };

export const statementReportValidator = v.object({
  totalSpentCents: v.number(),
  refundsCents: v.number(),
  paymentsCents: v.number(),
  netCents: v.number(),
  transactionCount: v.number(),
  internationalCents: v.number(),
  iofCents: v.number(),
  feesCents: v.number(),
  interestCents: v.number(),
  byCategory: v.array(v.object({ category: v.string(), ...totalValidator })),
  topMerchants: v.array(v.object({ merchant: v.string(), ...totalValidator })),
  installmentsCents: v.number(),
  futureInstallmentsCents: v.number(),
  installments: v.array(
    v.object({
      description: v.string(),
      amountCents: v.number(),
      installmentCurrent: v.number(),
      installmentTotal: v.number(),
      remainingCents: v.number(),
    }),
  ),
});

export type CreditCardIssuer = Infer<typeof creditCardIssuerValidator>;
export type CreditCardStatementStatus = Infer<
  typeof creditCardStatementStatusValidator
>;
export type CreditCardTransactionType = Infer<
  typeof creditCardTransactionTypeValidator
>;
