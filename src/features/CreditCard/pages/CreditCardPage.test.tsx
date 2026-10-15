// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@chakra-ui/react", () => ({
  Heading: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
  Text: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  VStack: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("../components/StatementUploader", () => ({
  default: () => <div>StatementUploader</div>,
}));

vi.mock("../components/StatementsList", () => ({
  default: () => <div>StatementsList</div>,
}));

import CreditCardPage from "./CreditCardPage";

afterEach(() => {
  cleanup();
});

describe("CreditCardPage", () => {
  it("renders the heading, the uploader and the statements list", () => {
    render(<CreditCardPage />);
    expect(
      screen.getByRole("heading", { name: "Credit Card" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/nubank or inter statement pdf/i)).toBeInTheDocument();
    expect(screen.getByText("StatementUploader")).toBeInTheDocument();
    expect(screen.getByText("StatementsList")).toBeInTheDocument();
  });
});
