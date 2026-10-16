// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { mockMatchMedia } from "@/test/mockMatchMedia";

const { paginatedState, usePaginatedQueryMock } = vi.hoisted(() => {
  const paginatedState = {
    results: [] as Doc<"creditCardTransactions">[],
    status: "Exhausted" as string,
  };
  return {
    paginatedState,
    usePaginatedQueryMock: vi.fn(() => ({
      ...paginatedState,
      loadMore: vi.fn(),
    })),
  };
});

vi.mock("convex/react", () => ({
  usePaginatedQuery: usePaginatedQueryMock,
  useQuery: () => ["Pets"],
}));

vi.mock("./TransactionCategorySelect", () => ({
  default: ({ category }: { category: string }) => <span>{category}</span>,
}));

import TransactionsTable from "./TransactionsTable";

const statementId = "statement1" as Id<"creditCardStatements">;

function transaction(
  overrides: Partial<Doc<"creditCardTransactions">>,
): Doc<"creditCardTransactions"> {
  return {
    _id: "transaction1" as Id<"creditCardTransactions">,
    _creationTime: 0,
    userId: "user1" as Id<"users">,
    statementId,
    date: "2026-10-01",
    description: "OXXO",
    amountCents: 1000,
    category: "groceries",
    type: "purchase",
    ...overrides,
  };
}

function renderTable(categories = ["groceries", "Pets", "food"]) {
  render(
    <ChakraProvider value={defaultSystem}>
      <TransactionsTable statementId={statementId} categories={categories} />
    </ChakraProvider>,
  );
  return screen.getByRole("combobox", { name: "Filter by category" });
}

describe("TransactionsTable", () => {
  beforeEach(() => {
    paginatedState.results = [transaction({})];
    paginatedState.status = "Exhausted";
    usePaginatedQueryMock.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("lists every transaction by default", () => {
    const filter = renderTable();

    expect(filter).toHaveValue("");
    expect(usePaginatedQueryMock).toHaveBeenLastCalledWith(
      expect.anything(),
      { statementId },
      expect.anything(),
    );
    expect(screen.getByText("OXXO")).toBeInTheDocument();
  });

  it("offers the statement categories sorted by label", () => {
    const filter = renderTable();

    expect(
      within(filter)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["All categories", "Food", "Groceries", "Pets"]);
  });

  it("queries only the chosen category", () => {
    const filter = renderTable();

    fireEvent.change(filter, { target: { value: "Pets" } });

    expect(filter).toHaveValue("Pets");
    expect(usePaginatedQueryMock).toHaveBeenLastCalledWith(
      expect.anything(),
      { statementId, category: "Pets" },
      expect.anything(),
    );
  });

  it("keeps the active filter selectable when it leaves the statement", () => {
    const view = (categories: string[]) => (
      <ChakraProvider value={defaultSystem}>
        <TransactionsTable statementId={statementId} categories={categories} />
      </ChakraProvider>
    );
    const { rerender } = render(view(["Pets"]));
    const filter = screen.getByRole("combobox", { name: "Filter by category" });
    fireEvent.change(filter, { target: { value: "Pets" } });

    rerender(view([]));

    expect(filter).toHaveValue("Pets");
    expect(
      within(filter).getByRole("option", { name: "Pets" }),
    ).toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", () => {
    paginatedState.results = [];
    renderTable();

    expect(
      screen.getByText("No transactions in this category."),
    ).toBeInTheDocument();
  });

  describe("on mobile", () => {
    const originalMatchMedia = window.matchMedia;

    beforeEach(() => {
      mockMatchMedia(true);
    });

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
    });

    it("lists the transactions as cards instead of a table", () => {
      paginatedState.results = [
        transaction({
          merchant: "Oxxo Store",
          installmentCurrent: 1,
          installmentTotal: 3,
        }),
      ];
      renderTable();

      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      const list = screen.getByRole("list", { name: "Transactions" });
      const card = within(list).getByRole("listitem");
      expect(within(card).getByText("Oxxo Store")).toBeInTheDocument();
      expect(within(card).getByText("OXXO")).toBeInTheDocument();
      expect(within(card).getByText("Installment 1/3")).toBeInTheDocument();
      expect(within(card).getByText("01/10/2026")).toBeInTheDocument();
      expect(within(card).getByText("Purchase")).toBeInTheDocument();
      expect(within(card).getByText("groceries")).toBeInTheDocument();
    });

    it("shows an empty state when nothing matches", () => {
      paginatedState.results = [];
      renderTable();

      expect(screen.queryByRole("list")).not.toBeInTheDocument();
      expect(
        screen.getByText("No transactions in this category."),
      ).toBeInTheDocument();
    });
  });
});
