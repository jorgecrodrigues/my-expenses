import { describe, expect, it } from "vitest";
import {
  buildCategoryOptions,
  categoryLabel,
  formatCents,
  formatDay,
  formatReferenceMonth,
  getMonthlyCategoryChart,
  getMonthlyIssuerAmounts,
  getMonthlyStats,
  getTotalMismatchCents,
  isStatementInProgress,
  issuerLabel,
} from "./creditCard";
import type { IssuerTotal } from "../../../../convex/lib/creditCardReport";

function month(value: string, byIssuer: IssuerTotal[] = []) {
  return {
    month: value,
    totalSpentCents: byIssuer.reduce((sum, i) => sum + i.totalSpentCents, 0),
    byIssuer,
  };
}

describe("getMonthlyCategoryChart", () => {
  it("builds one series per category with safe ids and amounts in reais", () => {
    const chart = getMonthlyCategoryChart(
      [
        {
          byCategory: [
            { category: "food & drinks", totalCents: 12345, count: 3 },
            { category: "transport", totalCents: 500, count: 1 },
            { category: "travel", totalCents: 9000, count: 1 },
          ],
        },
        { byCategory: [{ category: "transport", totalCents: -200, count: 1 }] },
      ],
      ["food & drinks", "transport"],
    );
    expect(chart.series.map(({ id, label }) => ({ id, label }))).toEqual([
      { id: "k0", label: "Food & drinks" },
      { id: "k1", label: "Transport" },
    ]);
    expect(chart.data).toEqual([{ k0: 123.45, k1: 5 }, {}]);
  });
});

describe("getMonthlyIssuerAmounts", () => {
  it("maps each issuer to the amount spent in reais", () => {
    expect(
      getMonthlyIssuerAmounts([
        month("2026-01", [
          { issuer: "nubank", totalSpentCents: 150050 },
          { issuer: "inter", totalSpentCents: 2000 },
        ]),
        month("2026-02"),
      ]),
    ).toEqual([{ nubank: 1500.5, inter: 20 }, {}]);
  });
});

describe("getMonthlyStats", () => {
  it("averages only the months with spending and finds the peak", () => {
    const stats = getMonthlyStats([
      month("2026-01", [{ issuer: "nubank", totalSpentCents: 1000 }]),
      month("2026-02"),
      month("2026-03", [{ issuer: "inter", totalSpentCents: 4001 }]),
    ]);
    expect(stats?.averageCents).toBe(2501);
    expect(stats?.activeMonths).toBe(2);
    expect(stats?.peak.month).toBe("2026-03");
  });

  it("returns null when nothing was spent", () => {
    expect(getMonthlyStats([month("2026-01"), month("2026-02")])).toBeNull();
  });
});

const normalizeSpaces = (value: string) => value.replace(/\s/g, " ");

describe("formatCents", () => {
  it("formats cents as BRL", () => {
    expect(normalizeSpaces(formatCents(123456))).toBe("R$ 1.234,56");
    expect(normalizeSpaces(formatCents(-500))).toBe("-R$ 5,00");
  });
});

describe("issuerLabel", () => {
  it("returns the display name of the issuer", () => {
    expect(issuerLabel("nubank")).toBe("Nubank");
    expect(issuerLabel("inter")).toBe("Inter");
  });
});

describe("categoryLabel", () => {
  it("capitalizes the category", () => {
    expect(categoryLabel("food")).toBe("Food");
    expect(categoryLabel("")).toBe("");
  });
});

describe("buildCategoryOptions", () => {
  it("lists built-in categories first, then custom ones sorted", () => {
    const options = buildCategoryOptions(["Pets", "Gym"]);

    expect(options[0]).toEqual({ value: "food", label: "Food" });
    expect(options.slice(-2)).toEqual([
      { value: "Gym", label: "Gym" },
      { value: "Pets", label: "Pets" },
    ]);
  });

  it("returns only built-in categories when there are no custom ones", () => {
    expect(buildCategoryOptions([]).map((o) => o.value)).not.toContain("Gym");
    expect(buildCategoryOptions([])).toHaveLength(14);
  });
});

describe("isStatementInProgress", () => {
  it("is true only while queued or analyzing", () => {
    expect(isStatementInProgress("pending")).toBe(true);
    expect(isStatementInProgress("processing")).toBe(true);
    expect(isStatementInProgress("completed")).toBe(false);
    expect(isStatementInProgress("failed")).toBe(false);
  });
});

describe("formatReferenceMonth", () => {
  it("formats YYYY-MM as a short month and year", () => {
    expect(formatReferenceMonth("2026-10")).toBe("Oct 2026");
    expect(formatReferenceMonth("2027-01")).toBe("Jan 2027");
  });

  it("returns a dash when missing or malformed", () => {
    expect(formatReferenceMonth(undefined)).toBe("-");
    expect(formatReferenceMonth("October")).toBe("-");
  });
});

describe("formatDay", () => {
  it("formats YYYY-MM-DD as DD/MM/YYYY", () => {
    expect(formatDay("2026-10-12")).toBe("12/10/2026");
  });

  it("returns a dash when missing or malformed", () => {
    expect(formatDay(undefined)).toBe("-");
    expect(formatDay("12/10/2026")).toBe("-");
  });
});

describe("getTotalMismatchCents", () => {
  it("returns the difference when it exceeds the tolerance", () => {
    expect(
      getTotalMismatchCents({ totalAmountCents: 10000, extractedSumCents: 9000 }),
    ).toBe(-1000);
  });

  it("ignores rounding differences up to the tolerance", () => {
    expect(
      getTotalMismatchCents({ totalAmountCents: 10000, extractedSumCents: 10100 }),
    ).toBeNull();
  });

  it("returns null when a total is unknown", () => {
    expect(getTotalMismatchCents({ totalAmountCents: 10000 })).toBeNull();
    expect(getTotalMismatchCents({ extractedSumCents: 10000 })).toBeNull();
  });
});
