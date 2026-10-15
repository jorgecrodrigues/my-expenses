import { describe, expect, it } from "vitest";
import {
  buildCategoryOptions,
  categoryLabel,
  formatCents,
  formatDay,
  formatReferenceMonth,
  getTotalMismatchCents,
  isStatementInProgress,
  issuerLabel,
} from "./creditCard";

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
