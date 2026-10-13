// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import {
  createEmptyTotals,
  type ExpenseTotals,
} from "@/features/Dashboard/utils/dashboardMetrics";
import SummaryCards from "./SummaryCards";

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  cleanup();
});

function renderWithChakra(ui: React.ReactElement) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

const brl = (text: string) =>
  new RegExp(text.replace(/\s/g, "\\s").replace(/\$/g, "\\$"));

const current: ExpenseTotals = {
  total: 290,
  paid: 140,
  pending: 100,
  overdue: 50,
  count: 4,
  paidCount: 2,
  pendingCount: 1,
  overdueCount: 1,
};

describe("SummaryCards", () => {
  it("renders the card labels with skeletons while loading", () => {
    renderWithChakra(<SummaryCards />);
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.queryByText(/bills paid/)).not.toBeInTheDocument();
  });

  it("renders the month totals", () => {
    renderWithChakra(
      <SummaryCards
        current={current}
        previous={{ ...createEmptyTotals(), total: 200 }}
      />,
    );

    expect(screen.getByText(brl("R$ 290,00"))).toBeInTheDocument();
    expect(screen.getByText(brl("R$ 140,00")).closest("dl")).toHaveTextContent(
      "Paid",
    );
    expect(screen.getByText(brl("R$ 150,00")).closest("dl")).toHaveTextContent(
      "Left to pay",
    );
    expect(screen.getByText(brl("R$ 50,00")).closest("dl")).toHaveTextContent(
      "Overdue",
    );
    expect(screen.getByText("2 of 4 bills paid")).toBeInTheDocument();
    expect(screen.getByText("2 open bills")).toBeInTheDocument();
    expect(screen.getByText("1 past due")).toBeInTheDocument();
    expect(screen.getByText("48%")).toBeInTheDocument();
  });

  it("shows the month-over-month change", () => {
    renderWithChakra(
      <SummaryCards
        current={{ ...current, total: 300 }}
        previous={{ ...createEmptyTotals(), total: 200 }}
      />,
    );
    expect(screen.getByText("50.0%")).toBeInTheDocument();
    expect(screen.getByText("vs last month")).toBeInTheDocument();
  });

  it("shows a decrease compared to last month", () => {
    renderWithChakra(
      <SummaryCards
        current={{ ...current, total: 150 }}
        previous={{ ...createEmptyTotals(), total: 200 }}
      />,
    );
    expect(screen.getByText("25.0%")).toBeInTheDocument();
  });

  it("explains when there is no previous month to compare", () => {
    renderWithChakra(
      <SummaryCards current={current} previous={createEmptyTotals()} />,
    );
    expect(screen.getByText("No spending last month")).toBeInTheDocument();
  });

  it("shows when nothing is past due", () => {
    renderWithChakra(
      <SummaryCards
        current={{ ...current, overdue: 0, overdueCount: 0 }}
        previous={createEmptyTotals()}
      />,
    );
    expect(screen.getByText("Nothing past due")).toBeInTheDocument();
  });
});
