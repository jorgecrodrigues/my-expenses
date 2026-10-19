// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { mockMatchMedia } from "@/test/mockMatchMedia";

type PeriodTransaction = Doc<"creditCardTransactions"> & {
  issuer: "nubank" | "inter";
};

const { queryState, useQueryMock } = vi.hoisted(() => ({
  queryState: { transactions: undefined as PeriodTransaction[] | undefined },
  useQueryMock: vi.fn(),
}));

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    creditCardStatements: {
      listPeriodTransactions: "listPeriodTransactions",
      listCustomCategories: "listCustomCategories",
    },
  },
}));

vi.mock("convex/react", () => ({
  useQuery: (fn: string, args: unknown) => {
    useQueryMock(fn, args);
    if (fn === "listCustomCategories") return [];
    return args === "skip" ? undefined : queryState.transactions;
  },
}));

vi.mock("./TransactionCategorySelect", () => ({
  default: ({ category }: { category: string }) => <span>{category}</span>,
}));

import PeriodTransactionsTable from "./PeriodTransactionsTable";

function transaction(index: number, overrides: Partial<PeriodTransaction> = {}): PeriodTransaction {
  return {
    _id: `transaction${index}` as Id<"creditCardTransactions">,
    _creationTime: 0,
    userId: "user1" as Id<"users">,
    statementId: "statement1" as Id<"creditCardStatements">,
    issuer: "nubank",
    date: "2026-03-05",
    description: `Purchase ${index}`,
    amountCents: 1000,
    category: "food",
    type: "purchase",
    ...overrides,
  };
}

function renderTable(props: { monthIndex?: number; category?: string } = {}) {
  render(
    <ChakraProvider value={defaultSystem}>
      <PeriodTransactionsTable year={2026} periodLabel="Mar 2026 · Food" {...props} />
    </ChakraProvider>,
  );
}

beforeEach(() => {
  queryState.transactions = undefined;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("PeriodTransactionsTable", () => {
  it("asks for a selection instead of loading the whole year", () => {
    renderTable();
    expect(useQueryMock).toHaveBeenCalledWith("listPeriodTransactions", "skip");
    expect(
      screen.getByText(/click a month in the chart or a category/i),
    ).toBeInTheDocument();
  });

  it("loads the lines of the selected month and category", () => {
    renderTable({ monthIndex: 2, category: "food" });
    expect(useQueryMock).toHaveBeenCalledWith("listPeriodTransactions", {
      year: 2026,
      month: 3,
      category: "food",
    });
  });

  it("lists the lines with their card and category", () => {
    queryState.transactions = [
      transaction(1, { merchant: "iFood", description: "IFOOD *A", issuer: "inter" }),
      transaction(2, {
        description: "Estorno",
        amountCents: -500,
        type: "refund",
        installmentCurrent: 2,
        installmentTotal: 5,
      }),
    ];
    renderTable({ monthIndex: 2 });

    expect(screen.getByText("Mar 2026 · Food · 2 lines")).toBeInTheDocument();
    expect(screen.getByText("iFood")).toBeInTheDocument();
    expect(screen.getByText("IFOOD *A")).toBeInTheDocument();
    expect(screen.getByText("Inter")).toBeInTheDocument();
    expect(screen.getByText("Installment 2/5")).toBeInTheDocument();
    expect(screen.getAllByText("food")).toHaveLength(2);
    expect(screen.getAllByText("05/03/2026")).toHaveLength(2);
  });

  it("shows an empty state", () => {
    queryState.transactions = [];
    renderTable({ category: "food" });
    expect(screen.getByText("No transactions in this period.")).toBeInTheDocument();
  });

  it("previews the first lines without a see more button when they all fit", () => {
    queryState.transactions = Array.from({ length: 10 }, (_, i) => transaction(i));
    renderTable({ monthIndex: 2 });

    expect(screen.getByText("Purchase 9")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "See more" })).not.toBeInTheDocument();
  });

  it("lists every line in a dialog, revealing more on demand", async () => {
    queryState.transactions = Array.from({ length: 60 }, (_, i) => transaction(i));
    renderTable({ monthIndex: 2 });

    expect(screen.getByText("Purchase 9")).toBeInTheDocument();
    expect(screen.queryByText("Purchase 10")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "See more" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Mar 2026 · Food · 60 lines")).toBeInTheDocument();
    expect(within(dialog).getByText("Purchase 49")).toBeInTheDocument();
    expect(within(dialog).queryByText("Purchase 50")).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Show more (10 left)" }));
    expect(within(dialog).getByText("Purchase 59")).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: /show more/i }),
    ).not.toBeInTheDocument();
  });

  describe("on mobile", () => {
    const originalMatchMedia = window.matchMedia;

    beforeEach(() => {
      mockMatchMedia(true);
    });

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
    });

    it("lists the lines as cards with their card issuer", () => {
      queryState.transactions = [
        transaction(1, { merchant: "iFood", description: "IFOOD *A", issuer: "inter" }),
        transaction(2, { description: "Estorno", amountCents: -500, type: "refund" }),
      ];
      renderTable({ monthIndex: 2 });

      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      const cards = within(
        screen.getByRole("list", { name: "Transactions" }),
      ).getAllByRole("listitem");
      expect(cards).toHaveLength(2);
      expect(within(cards[0]).getByText("iFood")).toBeInTheDocument();
      expect(within(cards[0]).getByText("IFOOD *A")).toBeInTheDocument();
      expect(within(cards[0]).getByText("Inter")).toBeInTheDocument();
      expect(within(cards[1]).getByText("Estorno")).toBeInTheDocument();
      expect(within(cards[1]).getByText("Nubank")).toBeInTheDocument();
    });

    it("shows an empty state", () => {
      queryState.transactions = [];
      renderTable({ category: "food" });
      expect(screen.getByText("No transactions in this period.")).toBeInTheDocument();
    });

    it("previews the first lines and lists every line in a dialog", async () => {
      queryState.transactions = Array.from({ length: 60 }, (_, i) => transaction(i));
      renderTable({ monthIndex: 2 });

      expect(screen.getAllByRole("listitem")).toHaveLength(10);
      fireEvent.click(screen.getByRole("button", { name: "See more" }));
      const dialog = await screen.findByRole("dialog");
      expect(within(dialog).getAllByRole("listitem")).toHaveLength(50);
      fireEvent.click(within(dialog).getByRole("button", { name: "Show more (10 left)" }));
      expect(within(dialog).getAllByRole("listitem")).toHaveLength(60);
    });
  });
});
