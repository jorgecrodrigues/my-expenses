// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import type { InstallmentItem } from "../../../../convex/lib/creditCardReport";
import { mockMatchMedia } from "@/test/mockMatchMedia";
import InstallmentsTable from "./InstallmentsTable";

const installments: InstallmentItem[] = [
  {
    description: "Notebook",
    amountCents: 50000,
    installmentCurrent: 2,
    installmentTotal: 10,
    remainingCents: 400000,
  },
];

function renderTable(items = installments) {
  render(
    <ChakraProvider value={defaultSystem}>
      <InstallmentsTable installments={items} />
    </ChakraProvider>,
  );
}

afterEach(() => {
  cleanup();
});

describe("InstallmentsTable", () => {
  it("shows an empty state", () => {
    renderTable([]);
    expect(
      screen.getByText("No installment purchases in this statement."),
    ).toBeInTheDocument();
  });

  it("renders a table row per installment", () => {
    renderTable();

    const row = screen.getByRole("row", { name: /notebook/i });
    expect(within(row).getByText("2/10")).toBeInTheDocument();
    expect(within(row).getByText("R$ 500,00")).toBeInTheDocument();
    expect(within(row).getByText("R$ 4.000,00")).toBeInTheDocument();
  });

  describe("on mobile", () => {
    const originalMatchMedia = window.matchMedia;

    beforeEach(() => {
      mockMatchMedia(true);
    });

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
    });

    it("lists installments without a table", () => {
      renderTable();

      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      const item = within(
        screen.getByRole("list", { name: "Installments" }),
      ).getByRole("listitem");
      expect(within(item).getByText("Notebook")).toBeInTheDocument();
      expect(within(item).getByText("Installment 2/10")).toBeInTheDocument();
      expect(within(item).getByText("R$ 500,00")).toBeInTheDocument();
      expect(within(item).getByText("R$ 4.000,00 left")).toBeInTheDocument();
    });
  });
});
