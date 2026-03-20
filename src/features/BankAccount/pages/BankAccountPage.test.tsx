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

vi.mock("../components/BankAccountsList", () => ({
  default: () => <div data-testid="bank-accounts-list" />,
}));

import BankAccountPage from "./BankAccountPage";

afterEach(() => {
  cleanup();
});

describe("BankAccountPage", () => {
  it("renders the page heading", () => {
    render(<BankAccountPage />);
    expect(screen.getByText("Bank Accounts")).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    render(<BankAccountPage />);
    expect(
      screen.getByText("Manage your bank accounts and track balances."),
    ).toBeInTheDocument();
  });

  it("renders the BankAccountsList component", () => {
    render(<BankAccountPage />);
    expect(screen.getByTestId("bank-accounts-list")).toBeInTheDocument();
  });
});
