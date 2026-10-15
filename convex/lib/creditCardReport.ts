import type {
  CreditCardIssuer,
  CreditCardTransactionType,
} from "./creditCardValidators";

export interface ReportTransaction {
  description: string;
  merchant?: string;
  amountCents: number;
  category: string;
  type: CreditCardTransactionType;
  installmentCurrent?: number;
  installmentTotal?: number;
  isInternational?: boolean;
}

export interface CategoryTotal {
  category: string;
  totalCents: number;
  count: number;
}

export interface MerchantTotal {
  merchant: string;
  totalCents: number;
  count: number;
}

export interface InstallmentItem {
  description: string;
  amountCents: number;
  installmentCurrent: number;
  installmentTotal: number;
  remainingCents: number;
}

export interface StatementReport {
  totalSpentCents: number;
  refundsCents: number;
  paymentsCents: number;
  netCents: number;
  transactionCount: number;
  internationalCents: number;
  iofCents: number;
  feesCents: number;
  interestCents: number;
  byCategory: CategoryTotal[];
  topMerchants: MerchantTotal[];
  installmentsCents: number;
  futureInstallmentsCents: number;
  installments: InstallmentItem[];
}

export const TOP_MERCHANTS_LIMIT = 10;

const SPENDING_TYPES: readonly CreditCardTransactionType[] = [
  "purchase",
  "fee",
  "iof",
  "interest",
];

function sumBy(
  transactions: ReportTransaction[],
  predicate: (transaction: ReportTransaction) => boolean,
): number {
  return transactions
    .filter(predicate)
    .reduce((sum, transaction) => sum + transaction.amountCents, 0);
}

type Totals = Map<string, { totalCents: number; count: number }>;

function sortedTotals(
  totals: Totals,
): { name: string; totalCents: number; count: number }[] {
  return [...totals.entries()]
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.totalCents - a.totalCents);
}

function addTo(totals: Totals, name: string, amountCents: number) {
  const current = totals.get(name) ?? { totalCents: 0, count: 0 };
  totals.set(name, {
    totalCents: current.totalCents + amountCents,
    count: current.count + 1,
  });
}

/**
 * Aggregates the transactions of one statement. Amounts are signed cents:
 * charges are positive, refunds and payments negative. Payments of the
 * previous statement are reported separately and never count as spending.
 */
/** Category totals net of refunds, highest first. Payments are left out. */
export function totalsByCategory(
  transactions: ReportTransaction[],
): CategoryTotal[] {
  const categoryTotals: Totals = new Map();
  for (const line of transactions.filter((t) => t.type !== "payment")) {
    addTo(categoryTotals, line.category, line.amountCents);
  }
  return sortedTotals(categoryTotals).map(({ name, ...rest }) => ({
    category: name,
    ...rest,
  }));
}

export function buildStatementReport(
  transactions: ReportTransaction[],
): StatementReport {
  const lines = transactions.filter((t) => t.type !== "payment");

  const merchantTotals: Totals = new Map();
  for (const line of lines.filter((t) => t.type === "purchase")) {
    addTo(merchantTotals, line.merchant ?? line.description, line.amountCents);
  }

  const installments: InstallmentItem[] = lines
    .filter(
      (t) =>
        t.type === "purchase" &&
        t.installmentCurrent !== undefined &&
        t.installmentTotal !== undefined,
    )
    .map((t) => {
      const installmentCurrent = t.installmentCurrent as number;
      const installmentTotal = t.installmentTotal as number;
      return {
        description: t.merchant ?? t.description,
        amountCents: t.amountCents,
        installmentCurrent,
        installmentTotal,
        remainingCents:
          t.amountCents * Math.max(installmentTotal - installmentCurrent, 0),
      };
    })
    .sort((a, b) => b.remainingCents - a.remainingCents);

  const totalSpentCents = sumBy(lines, (t) => SPENDING_TYPES.includes(t.type));
  const refundsCents = -sumBy(lines, (t) => t.type === "refund");

  return {
    totalSpentCents,
    refundsCents,
    paymentsCents: -sumBy(transactions, (t) => t.type === "payment"),
    netCents: totalSpentCents - refundsCents,
    transactionCount: lines.length,
    internationalCents: sumBy(
      lines,
      (t) => t.type === "purchase" && t.isInternational === true,
    ),
    iofCents: sumBy(lines, (t) => t.type === "iof"),
    feesCents: sumBy(lines, (t) => t.type === "fee"),
    interestCents: sumBy(lines, (t) => t.type === "interest"),
    byCategory: totalsByCategory(lines),
    topMerchants: sortedTotals(merchantTotals)
      .slice(0, TOP_MERCHANTS_LIMIT)
      .map(({ name, ...rest }) => ({ merchant: name, ...rest })),
    installmentsCents: installments.reduce((s, i) => s + i.amountCents, 0),
    futureInstallmentsCents: installments.reduce(
      (s, i) => s + i.remainingCents,
      0,
    ),
    installments,
  };
}

export interface IssuerTotal {
  issuer: CreditCardIssuer;
  totalSpentCents: number;
}

/** Aggregates of a set of statements, optionally restricted to a category. */
export interface PeriodSummary {
  statementCount: number;
  totalSpentCents: number;
  refundsCents: number;
  netCents: number;
  transactionCount: number;
  internationalCents: number;
  iofCents: number;
  feesCents: number;
  interestCents: number;
  byIssuer: IssuerTotal[];
  /** Every category of the period, regardless of the category filter. */
  byCategory: CategoryTotal[];
  topMerchants: MerchantTotal[];
}

export interface MonthSummary extends PeriodSummary {
  /** "YYYY-MM" */
  month: string;
}

export interface YearReport extends PeriodSummary {
  year: number;
  /** Always 12 entries, January to December. */
  months: MonthSummary[];
}

export interface YearStatement {
  issuer: CreditCardIssuer;
  /** "YYYY-MM" */
  referenceMonth: string;
  transactions: ReportTransaction[];
}

export const MIN_REPORT_YEAR = 2000;
export const MAX_REPORT_YEAR = 2100;

/**
 * Bounds of the reference months of a year, or of a single month of it, for
 * an index range query.
 *
 * @param month - 1 to 12; when omitted, the whole year.
 * @throws When the year or month is out of range.
 */
export function referenceMonthRange(
  year: number,
  month?: number,
): { start: string; end: string } {
  if (
    !Number.isInteger(year) ||
    year < MIN_REPORT_YEAR ||
    year > MAX_REPORT_YEAR
  ) {
    throw new Error(
      `Invalid year. Use a year between ${MIN_REPORT_YEAR} and ${MAX_REPORT_YEAR}`,
    );
  }
  if (month === undefined) {
    return { start: `${year}-01`, end: `${year}-12` };
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Invalid month. Use a month between 1 and 12");
  }
  const referenceMonth = `${year}-${String(month).padStart(2, "0")}`;
  return { start: referenceMonth, end: referenceMonth };
}

/** Years of the given reference months, newest first, without duplicates. */
export function referenceMonthYears(
  referenceMonths: (string | undefined)[],
): number[] {
  const years = new Set<number>();
  for (const referenceMonth of referenceMonths) {
    const match = referenceMonth ? /^(\d{4})-\d{2}$/.exec(referenceMonth) : null;
    if (match) {
      years.add(Number(match[1]));
    }
  }
  return [...years].sort((a, b) => b - a);
}

function issuerTotals(statements: YearStatement[]): IssuerTotal[] {
  const totals = new Map<CreditCardIssuer, number>();
  for (const statement of statements) {
    const spent = sumBy(statement.transactions, (t) =>
      SPENDING_TYPES.includes(t.type),
    );
    totals.set(statement.issuer, (totals.get(statement.issuer) ?? 0) + spent);
  }
  return [...totals.entries()]
    .map(([issuer, totalSpentCents]) => ({ issuer, totalSpentCents }))
    .sort((a, b) => b.totalSpentCents - a.totalSpentCents);
}

function summarizePeriod(
  statements: YearStatement[],
  category: string | undefined,
): PeriodSummary {
  const filtered =
    category === undefined
      ? statements
      : statements.map((statement) => ({
          ...statement,
          transactions: statement.transactions.filter(
            (t) => t.category === category,
          ),
        }));
  const report = buildStatementReport(
    filtered.flatMap((statement) => statement.transactions),
  );
  return {
    statementCount: statements.length,
    totalSpentCents: report.totalSpentCents,
    refundsCents: report.refundsCents,
    netCents: report.netCents,
    transactionCount: report.transactionCount,
    internationalCents: report.internationalCents,
    iofCents: report.iofCents,
    feesCents: report.feesCents,
    interestCents: report.interestCents,
    byIssuer: issuerTotals(filtered),
    byCategory:
      category === undefined
        ? report.byCategory
        : totalsByCategory(statements.flatMap((s) => s.transactions)),
    topMerchants: report.topMerchants,
  };
}

/**
 * Aggregates the statements of one year, as a whole and month by month.
 * Statements are placed in the month they refer to, so a purchase made in
 * December but billed in January counts for January. Installment details are
 * left out: summing them across statements would count the same purchase once
 * per month.
 *
 * @param category - When set, every figure except `byCategory` only counts
 * this category.
 */
export function buildYearReport(
  year: number,
  statements: YearStatement[],
  category?: string,
): YearReport {
  const months = Array.from({ length: 12 }, (_, index) => {
    const month = `${year}-${String(index + 1).padStart(2, "0")}`;
    return {
      month,
      ...summarizePeriod(
        statements.filter((statement) => statement.referenceMonth === month),
        category,
      ),
    };
  });
  return { year, ...summarizePeriod(statements, category), months };
}

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCents(cents: number): string {
  return brl.format(cents / 100);
}

export interface SummaryStatementInfo {
  issuer: CreditCardIssuer;
  referenceMonth?: string;
  totalAmountCents?: number;
}

/**
 * Prompt for the written summary. It only carries the computed aggregates, so
 * the model comments on numbers it cannot change.
 */
export function buildSummaryPrompt(
  statement: SummaryStatementInfo,
  report: StatementReport,
): string {
  const categories = report.byCategory
    .map((c) => `- ${c.category}: ${formatCents(c.totalCents)} (${c.count} lines)`)
    .join("\n");
  const merchants = report.topMerchants
    .map((m) => `- ${m.merchant}: ${formatCents(m.totalCents)} (${m.count}x)`)
    .join("\n");
  const installments = report.installments
    .slice(0, 10)
    .map(
      (i) =>
        `- ${i.description}: ${formatCents(i.amountCents)} (${i.installmentCurrent}/${i.installmentTotal}, ${formatCents(i.remainingCents)} remaining)`,
    )
    .join("\n");

  return [
    "You are a personal finance assistant. Write a short, detailed analysis of this credit card statement for its owner.",
    "Use Markdown with these sections: Overview, Where the money went, Installments and future commitments, Fees and international, Suggestions.",
    "Be specific and use the numbers below; do not invent data. Keep it under 300 words. Write in English.",
    "",
    `Issuer: ${statement.issuer}`,
    `Reference month: ${statement.referenceMonth ?? "unknown"}`,
    `Statement total: ${statement.totalAmountCents !== undefined ? formatCents(statement.totalAmountCents) : "unknown"}`,
    `Total spent: ${formatCents(report.totalSpentCents)}`,
    `Refunds: ${formatCents(report.refundsCents)}`,
    `Lines: ${report.transactionCount}`,
    `International purchases: ${formatCents(report.internationalCents)}`,
    `IOF: ${formatCents(report.iofCents)}`,
    `Bank fees: ${formatCents(report.feesCents)}`,
    `Interest and penalties: ${formatCents(report.interestCents)}`,
    `Installments this month: ${formatCents(report.installmentsCents)}`,
    `Future installments still to pay: ${formatCents(report.futureInstallmentsCents)}`,
    "",
    "By category:",
    categories || "- none",
    "",
    "Top merchants:",
    merchants || "- none",
    "",
    "Installments:",
    installments || "- none",
  ].join("\n");
}
