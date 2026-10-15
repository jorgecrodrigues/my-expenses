import { describe, expect, it } from "vitest";
import {
  buildStatementReport,
  buildSummaryPrompt,
  buildYearReport,
  formatCents,
  referenceMonthRange,
  referenceMonthYears,
  TOP_MERCHANTS_LIMIT,
  type ReportTransaction,
} from "./creditCardReport";

const transactions: ReportTransaction[] = [
  { description: "IFOOD *A", merchant: "iFood", amountCents: 5000, category: "food", type: "purchase" },
  { description: "IFOOD *B", merchant: "iFood", amountCents: 3000, category: "food", type: "purchase" },
  { description: "Uber", merchant: "Uber", amountCents: 2000, category: "transport", type: "purchase" },
  { description: "Notebook 2/10", merchant: "Loja", amountCents: 30000, category: "shopping", type: "purchase", installmentCurrent: 2, installmentTotal: 10 },
  { description: "Spotify", amountCents: 2200, category: "subscriptions", type: "purchase", isInternational: true },
  { description: "IOF", amountCents: 77, category: "fees", type: "iof" },
  { description: "Anuidade", amountCents: 1000, category: "fees", type: "fee" },
  { description: "Juros", amountCents: 500, category: "fees", type: "interest" },
  { description: "Estorno Uber", amountCents: -2000, category: "transport", type: "refund" },
  { description: "Pagamento recebido", amountCents: -100000, category: "other", type: "payment" },
];

describe("buildStatementReport", () => {
  const report = buildStatementReport(transactions);

  it("computes the spending totals without payments", () => {
    expect(report.totalSpentCents).toBe(5000 + 3000 + 2000 + 30000 + 2200 + 77 + 1000 + 500);
    expect(report.refundsCents).toBe(2000);
    expect(report.paymentsCents).toBe(100000);
    expect(report.netCents).toBe(report.totalSpentCents - 2000);
    expect(report.transactionCount).toBe(9);
  });

  it("breaks down fees, IOF, interest and international", () => {
    expect(report.iofCents).toBe(77);
    expect(report.feesCents).toBe(1000);
    expect(report.interestCents).toBe(500);
    expect(report.internationalCents).toBe(2200);
  });

  it("groups by category net of refunds, sorted by total", () => {
    expect(report.byCategory[0]).toEqual({ category: "shopping", totalCents: 30000, count: 1 });
    expect(report.byCategory.find((c) => c.category === "transport")).toEqual({
      category: "transport",
      totalCents: 0,
      count: 2,
    });
    expect(report.byCategory.find((c) => c.category === "other")).toBeUndefined();
  });

  it("ranks merchants by purchases, falling back to the description", () => {
    expect(report.topMerchants[0]).toEqual({ merchant: "Loja", totalCents: 30000, count: 1 });
    expect(report.topMerchants[1]).toEqual({ merchant: "iFood", totalCents: 8000, count: 2 });
    expect(report.topMerchants.some((m) => m.merchant === "Spotify")).toBe(true);
  });

  it("computes current and future installments", () => {
    expect(report.installmentsCents).toBe(30000);
    expect(report.futureInstallmentsCents).toBe(30000 * 8);
    expect(report.installments).toEqual([
      { description: "Loja", amountCents: 30000, installmentCurrent: 2, installmentTotal: 10, remainingCents: 240000 },
    ]);
  });

  it("limits the merchant ranking", () => {
    const many: ReportTransaction[] = Array.from({ length: 15 }, (_, i) => ({
      description: `Shop ${i}`,
      amountCents: 100 + i,
      category: "shopping",
      type: "purchase",
    }));
    expect(buildStatementReport(many).topMerchants).toHaveLength(TOP_MERCHANTS_LIMIT);
  });

  it("returns zeros for an empty list", () => {
    const empty = buildStatementReport([]);
    expect(empty.totalSpentCents).toBe(0);
    expect(empty.byCategory).toEqual([]);
    expect(empty.installments).toEqual([]);
  });
});

describe("buildYearReport", () => {
  const january: ReportTransaction[] = [
    { description: "IFOOD", merchant: "iFood", amountCents: 4000, category: "food", type: "purchase" },
    { description: "Pagamento", amountCents: -50000, category: "other", type: "payment" },
  ];
  const interJanuary: ReportTransaction[] = [
    { description: "Uber", merchant: "Uber", amountCents: 1500, category: "transport", type: "purchase" },
    { description: "IOF", amountCents: 50, category: "fees", type: "iof" },
  ];
  const march: ReportTransaction[] = [
    { description: "IFOOD", merchant: "iFood", amountCents: 6000, category: "food", type: "purchase" },
    { description: "Estorno", amountCents: -1000, category: "food", type: "refund" },
    { description: "Netflix 1/3", amountCents: 3000, category: "subscriptions", type: "purchase", installmentCurrent: 1, installmentTotal: 3 },
  ];

  const report = buildYearReport(2026, [
    { issuer: "nubank", referenceMonth: "2026-01", transactions: january },
    { issuer: "inter", referenceMonth: "2026-01", transactions: interJanuary },
    { issuer: "nubank", referenceMonth: "2026-03", transactions: march },
  ]);

  it("sums the spending of every statement of the year", () => {
    expect(report.year).toBe(2026);
    expect(report.statementCount).toBe(3);
    expect(report.totalSpentCents).toBe(4000 + 1500 + 50 + 6000 + 3000);
    expect(report.refundsCents).toBe(1000);
    expect(report.netCents).toBe(report.totalSpentCents - 1000);
    expect(report.iofCents).toBe(50);
    expect(report.transactionCount).toBe(6);
  });

  it("splits the spending by month and issuer", () => {
    expect(report.months).toHaveLength(12);
    expect(report.months[0]).toEqual({
      month: "2026-01",
      totalSpentCents: 5550,
      byIssuer: [
        { issuer: "nubank", totalSpentCents: 4000 },
        { issuer: "inter", totalSpentCents: 1550 },
      ],
    });
    expect(report.months[1]).toEqual({ month: "2026-02", totalSpentCents: 0, byIssuer: [] });
    expect(report.months[2].totalSpentCents).toBe(9000);
    expect(report.months[11].month).toBe("2026-12");
    expect(report.byIssuer).toEqual([
      { issuer: "nubank", totalSpentCents: 13000 },
      { issuer: "inter", totalSpentCents: 1550 },
    ]);
  });

  it("merges categories and merchants across statements", () => {
    expect(report.byCategory[0]).toEqual({ category: "food", totalCents: 9000, count: 3 });
    expect(report.topMerchants[0]).toEqual({ merchant: "iFood", totalCents: 10000, count: 2 });
  });

  it("returns twelve empty months when there are no statements", () => {
    const empty = buildYearReport(2025, []);
    expect(empty.totalSpentCents).toBe(0);
    expect(empty.byIssuer).toEqual([]);
    expect(empty.months.map((m) => m.month)).toEqual(
      Array.from({ length: 12 }, (_, i) => `2025-${String(i + 1).padStart(2, "0")}`),
    );
  });
});

describe("referenceMonthRange", () => {
  it("returns the first and last month of the year", () => {
    expect(referenceMonthRange(2026)).toEqual({ start: "2026-01", end: "2026-12" });
  });

  it("rejects implausible years", () => {
    expect(() => referenceMonthRange(2026.5)).toThrow("Invalid year");
    expect(() => referenceMonthRange(1999)).toThrow("Invalid year");
    expect(() => referenceMonthRange(2101)).toThrow("Invalid year");
  });
});

describe("referenceMonthYears", () => {
  it("lists distinct years newest first, ignoring missing or malformed months", () => {
    expect(
      referenceMonthYears(["2025-12", "2026-01", undefined, "2026-03", "bad", "2024-07"]),
    ).toEqual([2026, 2025, 2024]);
  });

  it("returns an empty list when there are no months", () => {
    expect(referenceMonthYears([])).toEqual([]);
  });
});

describe("formatCents", () => {
  it("formats cents as BRL", () => {
    expect(formatCents(123456).replace(/\s/g, " ")).toBe("R$ 1.234,56");
  });
});

describe("buildSummaryPrompt", () => {
  it("includes the computed aggregates", () => {
    const prompt = buildSummaryPrompt(
      { issuer: "nubank", referenceMonth: "2026-10", totalAmountCents: 40777 },
      buildStatementReport(transactions),
    );
    expect(prompt).toContain("Issuer: nubank");
    expect(prompt).toContain("Reference month: 2026-10");
    expect(prompt).toContain("iFood");
    expect(prompt).toContain("2/10");
  });

  it("handles missing statement info", () => {
    const prompt = buildSummaryPrompt({ issuer: "inter" }, buildStatementReport([]));
    expect(prompt).toContain("Reference month: unknown");
    expect(prompt).toContain("Statement total: unknown");
  });
});
