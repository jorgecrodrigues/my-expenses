import { describe, expect, it } from "vitest";
import {
  buildExtractionPrompt,
  normalizeDate,
  normalizeReferenceMonth,
  parseExtraction,
  sumStatementCents,
  toCents,
} from "./creditCardExtraction";

const validStatement = {
  referenceMonth: "2026-10",
  closingDate: "2026-10-03",
  dueDate: "10/10/2026",
  totalAmount: 1234.56,
  cardLastDigits: "**** 1234",
  transactions: [
    {
      date: "2026-09-12",
      description: "iFood *Restaurante",
      merchant: "iFood",
      amount: 45.9,
      category: "food",
      type: "purchase",
    },
  ],
};

describe("toCents", () => {
  it("rounds reais to integer cents", () => {
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(toCents(1234.565)).toBe(123457);
    expect(toCents(-10)).toBe(-1000);
  });
});

describe("normalizeDate", () => {
  it("accepts ISO and Brazilian formats", () => {
    expect(normalizeDate("2026-09-12")).toBe("2026-09-12");
    expect(normalizeDate("12/09/2026")).toBe("2026-09-12");
  });

  it("rejects invalid values", () => {
    expect(normalizeDate("12 SET")).toBeUndefined();
    expect(normalizeDate("2026-13-01")).toBeUndefined();
    expect(normalizeDate(20260912)).toBeUndefined();
    expect(normalizeDate("")).toBeUndefined();
  });
});

describe("normalizeReferenceMonth", () => {
  it("keeps only YYYY-MM", () => {
    expect(normalizeReferenceMonth("2026-10")).toBe("2026-10");
    expect(normalizeReferenceMonth("2026-10-10")).toBe("2026-10");
  });

  it("rejects invalid months", () => {
    expect(normalizeReferenceMonth("2026-00")).toBeUndefined();
    expect(normalizeReferenceMonth("October")).toBeUndefined();
    expect(normalizeReferenceMonth(undefined)).toBeUndefined();
  });
});

describe("parseExtraction", () => {
  it("normalizes the statement header", () => {
    const result = parseExtraction(validStatement);
    expect(result).toMatchObject({
      referenceMonth: "2026-10",
      closingDate: "2026-10-03",
      dueDate: "2026-10-10",
      totalAmountCents: 123456,
      cardLastDigits: "1234",
    });
    expect(result.transactions[0]).toMatchObject({
      date: "2026-09-12",
      merchant: "iFood",
      amountCents: 4590,
      category: "food",
      type: "purchase",
    });
  });

  it("maps unknown categories and types to fallbacks", () => {
    const result = parseExtraction({
      ...validStatement,
      transactions: [
        {
          date: "2026-09-12",
          description: "Something",
          amount: 10,
          category: "pets",
          type: "weird",
        },
      ],
    });
    expect(result.transactions[0]).toMatchObject({
      category: "other",
      type: "purchase",
    });
  });

  it("forces refunds and payments to negative amounts", () => {
    const result = parseExtraction({
      ...validStatement,
      transactions: [
        { date: "2026-09-12", description: "Estorno", amount: 20, category: "shopping", type: "refund" },
        { date: "2026-09-13", description: "Pagamento", amount: -500, category: "other", type: "payment" },
      ],
    });
    expect(result.transactions.map((t) => t.amountCents)).toEqual([-2000, -50000]);
  });

  it("keeps only consistent installment markers", () => {
    const result = parseExtraction({
      ...validStatement,
      transactions: [
        { date: "2026-09-12", description: "Loja 3/10", amount: 100, category: "shopping", type: "purchase", installmentCurrent: 3, installmentTotal: 10 },
        { date: "2026-09-12", description: "Loja 11/10", amount: 100, category: "shopping", type: "purchase", installmentCurrent: 11, installmentTotal: 10 },
        { date: "2026-09-12", description: "Loja 1/1", amount: 100, category: "shopping", type: "purchase", installmentCurrent: 1, installmentTotal: 1 },
      ],
    });
    expect(result.transactions.map((t) => [t.installmentCurrent, t.installmentTotal])).toEqual([
      [3, 10],
      [undefined, undefined],
      [undefined, undefined],
    ]);
  });

  it("flags international purchases from the original currency", () => {
    const result = parseExtraction({
      ...validStatement,
      transactions: [
        { date: "2026-09-12", description: "Netflix", amount: 55, category: "subscriptions", type: "purchase", originalCurrency: "usd", originalAmount: 9.99 },
        { date: "2026-09-12", description: "Padaria", amount: 12, category: "food", type: "purchase", originalCurrency: "BRL", originalAmount: 12 },
      ],
    });
    expect(result.transactions[0]).toMatchObject({
      isInternational: true,
      originalCurrency: "USD",
      originalAmount: 9.99,
    });
    expect(result.transactions[1].isInternational).toBeUndefined();
    expect(result.transactions[1].originalCurrency).toBeUndefined();
  });

  it("drops malformed transaction lines", () => {
    const result = parseExtraction({
      ...validStatement,
      transactions: [
        ...validStatement.transactions,
        { date: "invalid", description: "x", amount: 1, category: "food", type: "purchase" },
        { date: "2026-09-12", description: "", amount: 1, category: "food", type: "purchase" },
        { date: "2026-09-12", description: "x", amount: "1", category: "food", type: "purchase" },
        null,
      ],
    });
    expect(result.transactions).toHaveLength(1);
  });

  it("throws on a malformed header", () => {
    expect(() => parseExtraction(null)).toThrow("not a JSON object");
    expect(() => parseExtraction({ ...validStatement, referenceMonth: "x" })).toThrow("reference month");
    expect(() => parseExtraction({ ...validStatement, totalAmount: undefined })).toThrow("total amount");
    expect(() => parseExtraction({ ...validStatement, transactions: "none" })).toThrow("transaction list");
    expect(() => parseExtraction({ ...validStatement, transactions: [] })).toThrow("No transactions");
  });
});

describe("sumStatementCents", () => {
  it("ignores payments of the previous statement", () => {
    expect(
      sumStatementCents([
        { amountCents: 1000, type: "purchase" },
        { amountCents: -200, type: "refund" },
        { amountCents: 50, type: "iof" },
        { amountCents: -90000, type: "payment" },
      ]),
    ).toBe(850);
  });

  it("returns zero for an empty list", () => {
    expect(sumStatementCents([])).toBe(0);
  });
});

describe("buildExtractionPrompt", () => {
  it("includes issuer-specific hints", () => {
    expect(buildExtractionPrompt("nubank")).toContain("Nubank");
    expect(buildExtractionPrompt("inter")).toContain("Banco Inter");
  });
});
