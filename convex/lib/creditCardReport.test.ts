import { describe, expect, it } from "vitest";
import {
  buildStatementReport,
  buildSummaryPrompt,
  formatCents,
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
