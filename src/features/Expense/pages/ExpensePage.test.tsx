// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@chakra-ui/react", () => ({
  VStack: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Heading: ({ children }: { children: React.ReactNode }) => (
    <h1>{children}</h1>
  ),
  Text: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

vi.mock("../components/ExpensesList", () => ({
  default: () => <div data-testid="expenses-list" />,
}));

import ExpensePage from "./ExpensePage";

afterEach(() => {
  cleanup();
});

describe("ExpensePage", () => {
  it("renders the page heading", () => {
    render(<ExpensePage />);
    expect(screen.getByRole("heading", { name: "Expense List" })).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    render(<ExpensePage />);
    expect(
      screen.getByText("Manage and track your expenses efficiently."),
    ).toBeInTheDocument();
  });

  it("renders the ExpensesList component", () => {
    render(<ExpensePage />);
    expect(screen.getByTestId("expenses-list")).toBeInTheDocument();
  });
});
