import { formatBRL } from "@/shared/utils/currency";
import {
  CREDIT_CARD_CATEGORIES,
  CREDIT_CARD_ISSUERS,
} from "../../../../convex/lib/creditCardRules";
import { generateColorByString } from "@/shared/utils/color";
import type {
  CategoryTotal,
  IssuerTotal,
} from "../../../../convex/lib/creditCardReport";
import type {
  CreditCardIssuer,
  CreditCardStatementStatus,
} from "../../../../convex/lib/creditCardValidators";

/** Differences up to this many cents are rounding noise, not a mismatch. */
export const TOTAL_MISMATCH_TOLERANCE_CENTS = 100;

export const formatCents = (cents: number, compact = false): string =>
  formatBRL(cents / 100, compact);

export function issuerLabel(issuer: CreditCardIssuer): string {
  return CREDIT_CARD_ISSUERS.find((i) => i.value === issuer)?.label ?? issuer;
}

export const ISSUER_COLORS: Record<CreditCardIssuer, string> = {
  nubank: "purple.solid",
  inter: "orange.solid",
};

/**
 * Chart rows (one per month) mapping each issuer to the amount spent, in
 * reais.
 */
export function getMonthlyIssuerAmounts(
  months: { byIssuer: IssuerTotal[] }[],
): Record<string, number>[] {
  return months.map((month) =>
    Object.fromEntries(
      month.byIssuer.map((item) => [item.issuer, item.totalSpentCents / 100]),
    ),
  );
}

export interface ChartSeries {
  id: string;
  label: string;
  color: string;
}

/**
 * Chart series and rows (one per month, in reais) for the given categories.
 * Series ids are generated because category names may not be safe chart keys;
 * months where a category is net negative (refunds only) show nothing.
 */
export function getMonthlyCategoryChart(
  months: { byCategory: CategoryTotal[] }[],
  categories: string[],
): { series: ChartSeries[]; data: Record<string, number>[] } {
  const idByCategory = new Map(
    categories.map((category, index) => [category, `k${index}`]),
  );
  return {
    series: categories.map((category, index) => ({
      id: `k${index}`,
      label: categoryLabel(category),
      color: generateColorByString(category),
    })),
    data: months.map((month) => {
      const row: Record<string, number> = {};
      for (const item of month.byCategory) {
        const id = idByCategory.get(item.category);
        if (id && item.totalCents > 0) row[id] = item.totalCents / 100;
      }
      return row;
    }),
  };
}

/**
 * Average and highest month among the months with spending, or null when
 * nothing was spent.
 */
export function getMonthlyStats<T extends { totalSpentCents: number }>(
  months: T[],
): {
  averageCents: number;
  activeMonths: number;
  peak: T;
} | null {
  const active = months.filter((month) => month.totalSpentCents > 0);
  if (active.length === 0) return null;
  const total = active.reduce((sum, month) => sum + month.totalSpentCents, 0);
  const peak = active.reduce((max, month) =>
    month.totalSpentCents > max.totalSpentCents ? month : max,
  );
  return {
    averageCents: Math.round(total / active.length),
    activeMonths: active.length,
    peak,
  };
}

export function categoryLabel(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export interface CategoryOption {
  value: string;
  label: string;
}

/** Built-in categories followed by the user's own, sorted by label. */
export function buildCategoryOptions(
  customCategories: readonly string[],
): CategoryOption[] {
  const custom = [...customCategories]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ value: name, label: categoryLabel(name) }));
  return [
    ...CREDIT_CARD_CATEGORIES.map((value) => ({
      value,
      label: categoryLabel(value),
    })),
    ...custom,
  ];
}

export const STATUS_META: Record<
  CreditCardStatementStatus,
  { label: string; colorPalette: string }
> = {
  pending: { label: "Queued", colorPalette: "gray" },
  processing: { label: "Analyzing", colorPalette: "blue" },
  completed: { label: "Ready", colorPalette: "green" },
  failed: { label: "Failed", colorPalette: "red" },
};

export function isStatementInProgress(status: CreditCardStatementStatus) {
  return status === "pending" || status === "processing";
}

/** Formats "2026-10" as "Oct 2026"; returns "-" when missing or malformed. */
export function formatReferenceMonth(referenceMonth?: string): string {
  const match = referenceMonth ? /^(\d{4})-(\d{2})$/.exec(referenceMonth) : null;
  if (!match) return "-";
  return new Date(Number(match[1]), Number(match[2]) - 1, 1).toLocaleString(
    "en-US",
    { month: "short", year: "numeric" },
  );
}

/** Formats "2026-10-12" as "12/10/2026"; returns "-" when missing or malformed. */
export function formatDay(date?: string): string {
  const match = date ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(date) : null;
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "-";
}

/**
 * Difference between the sum of the extracted lines and the printed statement
 * total, or null when they match (or one of them is unknown).
 */
export function getTotalMismatchCents(statement: {
  totalAmountCents?: number;
  extractedSumCents?: number;
}): number | null {
  const { totalAmountCents, extractedSumCents } = statement;
  if (totalAmountCents === undefined || extractedSumCents === undefined) {
    return null;
  }
  const difference = extractedSumCents - totalAmountCents;
  return Math.abs(difference) > TOTAL_MISMATCH_TOLERANCE_CENTS
    ? difference
    : null;
}
