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

vi.mock("@/features/Dashboard/components/MonthlyStackedBarChart", () => ({
  default: ({
    data,
    series,
    showLegend,
  }: {
    data: Record<string, number>[];
    series: { id: string; label: string }[];
    showLegend?: boolean;
  }) => (
    <div>
      MonthlyChart {series.map((s) => s.label).join(",")} Jan:
      {JSON.stringify(data[0])} legend:{String(showLegend)}
    </div>
  ),
}));

vi.mock("./StatementCategoryChart", () => ({
  default: ({ categories }: { categories: unknown[] }) => (
    <div>CategoryChart ({categories.length})</div>
  ),
}));

import YearDashboard from "./YearDashboard";
import type { MonthTotal } from "../../../../convex/lib/creditCardReport";

function emptyMonths(year: number): MonthTotal[] {
  return Array.from({ length: 12 }, (_, i) => ({
    month: `${year}-${String(i + 1).padStart(2, "0")}`,
    totalSpentCents: 0,
    byIssuer: [],
  }));
}

function makeReport(year: number) {
  const months = emptyMonths(year);
  months[0] = {
    month: `${year}-01`,
    totalSpentCents: 300000,
    byIssuer: [
      { issuer: "nubank", totalSpentCents: 200000 },
      { issuer: "inter", totalSpentCents: 100000 },
    ],
  };
  months[2] = {
    month: `${year}-03`,
    totalSpentCents: 100000,
    byIssuer: [{ issuer: "nubank", totalSpentCents: 100000 }],
  };
  return {
    year,
    statementCount: 3,
    totalSpentCents: 400000,
    refundsCents: 0,
    netCents: 400000,
    transactionCount: 42,
    internationalCents: 5000,
    iofCents: 219,
    feesCents: 0,
    interestCents: 0,
    byIssuer: [
      { issuer: "nubank", totalSpentCents: 300000 },
      { issuer: "inter", totalSpentCents: 100000 },
    ],
    byCategory: [{ category: "food", totalCents: 80000, count: 8 }],
    topMerchants: [{ merchant: "iFood", totalCents: 60000, count: 6 }],
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

const normalizeSpaces = (value: string | null | undefined) =>
  value?.replace(/\s/g, " ");

beforeEach(() => {
  queryState.years = undefined;
  queryState.report = undefined;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("YearDashboard", () => {
  it("shows a loading state while the years load", () => {
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
    expect(useQueryMock).toHaveBeenCalledWith("getYearReport", "skip");
  });

  it("loads the most recent year by default", () => {
    queryState.years = [2026, 2025];
    renderDashboard();
    expect(useQueryMock).toHaveBeenCalledWith("getYearReport", { year: 2026 });
    expect(
      screen.getByRole("heading", { name: "Spending in 2026" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Loading yearly report")).toBeInTheDocument();
  });

  it("renders the yearly report", () => {
    queryState.years = [2026];
    queryState.report = makeReport(2026);
    renderDashboard();

    expect(screen.getByText("Total spent")).toBeInTheDocument();
    expect(screen.getByText(/^R\$\s4\.000,00$/)).toBeInTheDocument();
    expect(screen.getByText(/3 statements · 42 lines/)).toBeInTheDocument();
    expect(
      normalizeSpaces(screen.getByText(/^Peak/).textContent),
    ).toBe("Peak Jan 2026: R$ 3.000,00");
    expect(
      screen.getByText(
        'MonthlyChart Nubank,Inter Jan:{"nubank":2000,"inter":1000} legend:true',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("CategoryChart (1)")).toBeInTheDocument();
    expect(screen.getByText("iFood")).toBeInTheDocument();
  });

  it("switches to the picked year", () => {
    queryState.years = [2026, 2025];
    queryState.report = makeReport(2026);
    renderDashboard();

    queryState.report = makeReport(2025);
    fireEvent.change(screen.getByRole("combobox", { name: "Year" }), {
      target: { value: "2025" },
    });

    expect(useQueryMock).toHaveBeenLastCalledWith("getYearReport", {
      year: 2025,
    });
    expect(
      screen.getByRole("heading", { name: "Spending in 2025" }),
    ).toBeInTheDocument();
  });
});
