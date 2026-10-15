// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";

const { queryState, useQueryMock } = vi.hoisted(() => ({
  queryState: {
    years: undefined as number[] | undefined,
    report: undefined as unknown,
  },
  useQueryMock: vi.fn(),
}));

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    creditCardStatements: {
      listStatementYears: "listStatementYears",
      getYearReport: "getYearReport",
    },
  },
}));

vi.mock("convex/react", () => ({
  useQuery: (fn: string, args: unknown) => {
    useQueryMock(fn, args);
    if (fn === "listStatementYears") return queryState.years;
    return args === "skip" ? undefined : queryState.report;
  },
}));

vi.mock("@/shared/components/CustomYearPicker", () => ({
  default: ({
    value,
    onPreviousYear,
    onNextYear,
    onValueChange,
  }: {
    value?: { year: number }[];
    onPreviousYear?: () => void;
    onNextYear?: () => void;
    onValueChange?: (details: { value: { year: number }[] }) => void;
  }) => (
    <div>
      <span>Picker {value?.[0]?.year}</span>
      <button onClick={onPreviousYear}>Previous year</button>
      <button onClick={onNextYear}>Next year</button>
      <button onClick={() => onValueChange?.({ value: [{ year: 2024 }] })}>
        Pick 2024
      </button>
    </div>
  ),
}));

vi.mock("./YearMonthlyChart", () => ({
  default: ({
    selectedMonthIndex,
    selectedCategory,
    onSelectMonth,
  }: {
    selectedMonthIndex?: number;
    selectedCategory?: string;
    onSelectMonth: (monthIndex?: number) => void;
  }) => (
    <div>
      <span>
        MonthlyChart month:{String(selectedMonthIndex)} category:
        {String(selectedCategory)}
      </span>
      <button onClick={() => onSelectMonth(2)}>Select March</button>
    </div>
  ),
}));

vi.mock("./StatementCategoryChart", () => ({
  default: ({
    categories,
    subtitle,
    onSelectCategory,
  }: {
    categories: unknown[];
    subtitle?: string;
    onSelectCategory?: (category?: string) => void;
  }) => (
    <div>
      <span>
        CategoryChart ({categories.length}) {subtitle}
      </span>
      <button onClick={() => onSelectCategory?.("food")}>Select food</button>
    </div>
  ),
}));

vi.mock("./PeriodTransactionsTable", () => ({
  default: ({ periodLabel }: { periodLabel: string }) => (
    <div>Transactions {periodLabel}</div>
  ),
}));

import YearDashboard from "./YearDashboard";
import type {
  PeriodSummary,
  YearReport,
} from "../../../../convex/lib/creditCardReport";

function period(overrides: Partial<PeriodSummary> = {}): PeriodSummary {
  return {
    statementCount: 0,
    totalSpentCents: 0,
    refundsCents: 0,
    netCents: 0,
    transactionCount: 0,
    internationalCents: 0,
    iofCents: 0,
    feesCents: 0,
    interestCents: 0,
    byIssuer: [],
    byCategory: [],
    topMerchants: [],
    ...overrides,
  };
}

function makeReport(year: number): YearReport {
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: `${year}-${String(i + 1).padStart(2, "0")}`,
    ...period(),
  }));
  months[0] = {
    ...months[0],
    ...period({
      statementCount: 2,
      totalSpentCents: 300000,
      transactionCount: 30,
      byCategory: [{ category: "food", totalCents: 50000, count: 5 }],
      topMerchants: [{ merchant: "Padaria", totalCents: 20000, count: 2 }],
    }),
  };
  months[2] = {
    ...months[2],
    ...period({
      statementCount: 1,
      totalSpentCents: 100000,
      transactionCount: 12,
      byCategory: [
        { category: "food", totalCents: 30000, count: 3 },
        { category: "transport", totalCents: 10000, count: 2 },
      ],
      topMerchants: [{ merchant: "Uber", totalCents: 10000, count: 2 }],
    }),
  };
  return {
    year,
    ...period({
      statementCount: 3,
      totalSpentCents: 400000,
      transactionCount: 42,
      internationalCents: 5000,
      iofCents: 219,
      byCategory: [{ category: "food", totalCents: 80000, count: 8 }],
      topMerchants: [{ merchant: "iFood", totalCents: 60000, count: 6 }],
    }),
    months,
  };
}

function renderDashboard() {
  return render(
    <ChakraProvider value={defaultSystem}>
      <YearDashboard />
    </ChakraProvider>,
  );
}

const search = () => new URLSearchParams(window.location.search);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 15));
  window.history.pushState({}, "", "/credit-card");
  queryState.years = undefined;
  queryState.report = undefined;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("YearDashboard", () => {
  it("waits for the statement years before picking a default year", () => {
    renderDashboard();
    expect(screen.getByLabelText("Loading yearly report")).toBeInTheDocument();
    expect(useQueryMock).toHaveBeenCalledWith("getYearReport", "skip");
  });

  it("renders nothing when there are no processed statements", () => {
    queryState.years = [];
    renderDashboard();
    expect(
      screen.queryByRole("region", { name: "Yearly spending" }),
    ).not.toBeInTheDocument();
  });

  it("defaults to the most recent year with statements", () => {
    queryState.years = [2025, 2024];
    renderDashboard();
    expect(useQueryMock).toHaveBeenCalledWith("getYearReport", {
      year: 2025,
      category: undefined,
    });
    expect(
      screen.getByRole("heading", { name: "Spending in 2025" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Picker 2025")).toBeInTheDocument();
  });

  it("renders the whole year when no month is selected", () => {
    queryState.years = [2026];
    queryState.report = makeReport(2026);
    renderDashboard();

    expect(screen.getByText(/3 statements · 42 lines/)).toBeInTheDocument();
    expect(screen.getByText("Monthly average")).toBeInTheDocument();
    expect(screen.getByText("CategoryChart (1) Whole 2026")).toBeInTheDocument();
    expect(screen.getByText("iFood")).toBeInTheDocument();
    expect(
      screen.getByText("Transactions Whole 2026 · all categories"),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Active filters")).not.toBeInTheDocument();
  });

  it("reads the year, month and category from the URL", () => {
    window.history.pushState({}, "", "/credit-card?year=2024&month=3&category=food");
    queryState.years = [2026];
    queryState.report = makeReport(2024);
    renderDashboard();

    expect(useQueryMock).toHaveBeenCalledWith("getYearReport", {
      year: 2024,
      category: "food",
    });
    expect(screen.getByText("MonthlyChart month:2 category:food")).toBeInTheDocument();
    expect(screen.getByText("Share of the year")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(screen.getByText(/1 statement · 12 lines/)).toBeInTheDocument();
    expect(screen.getByText("CategoryChart (2) Mar 2024")).toBeInTheDocument();
    expect(screen.getByText("Uber")).toBeInTheDocument();
    expect(screen.getByText("Transactions Mar 2024 · Food")).toBeInTheDocument();
  });

  it("clears the month and the category from the filter tags", () => {
    window.history.pushState({}, "", "/credit-card?year=2026&month=3&category=food");
    queryState.years = [2026];
    queryState.report = makeReport(2026);
    renderDashboard();

    fireEvent.click(screen.getByRole("button", { name: "Show the whole year" }));
    expect(search().get("month")).toBeNull();
    expect(search().get("category")).toBe("food");

    fireEvent.click(screen.getByRole("button", { name: "Show all categories" }));
    expect(search().get("category")).toBeNull();
  });

  it("selects a month from the chart and a category from the breakdown", () => {
    queryState.years = [2026];
    queryState.report = makeReport(2026);
    renderDashboard();

    fireEvent.click(screen.getByRole("button", { name: "Select March" }));
    expect(search().get("month")).toBe("3");
    expect(screen.getByText("MonthlyChart month:2 category:undefined")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Select food" }));
    expect(search().get("category")).toBe("food");
  });

  it("moves between years and clears the selected month", () => {
    window.history.pushState({}, "", "/credit-card?year=2025&month=3");
    queryState.years = [2026];
    renderDashboard();

    fireEvent.click(screen.getByRole("button", { name: "Next year" }));
    expect(search().get("year")).toBe("2026");
    expect(search().get("month")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Previous year" }));
    expect(search().get("year")).toBe("2025");

    fireEvent.click(screen.getByRole("button", { name: "Pick 2024" }));
    expect(search().get("year")).toBe("2024");
  });

  it("offers a shortcut to the current year", () => {
    window.history.pushState({}, "", "/credit-card?year=2024");
    queryState.years = [2026];
    renderDashboard();

    fireEvent.click(screen.getByRole("button", { name: "Go to 2026" }));
    expect(search().get("year")).toBe("2026");
    expect(
      screen.queryByRole("button", { name: "Go to 2026" }),
    ).not.toBeInTheDocument();
  });

  it("ignores a year outside the supported range", () => {
    window.history.pushState({}, "", "/credit-card?year=1990");
    queryState.years = [2025];
    renderDashboard();
    expect(useQueryMock).toHaveBeenCalledWith("getYearReport", {
      year: 2025,
      category: undefined,
    });
  });

  it("keeps the previous report on screen while the next one loads", () => {
    queryState.years = [2026];
    queryState.report = makeReport(2026);
    renderDashboard();

    queryState.report = undefined;
    fireEvent.click(screen.getByRole("button", { name: "Select food" }));

    expect(screen.queryByLabelText("Loading yearly report")).not.toBeInTheDocument();
    expect(screen.getByText("iFood")).toBeInTheDocument();
    expect(screen.getByText("Monthly average").closest("[aria-busy]")).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });
});
