// @vitest-environment jsdom
import type { ReactElement } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ChakraProvider, defaultSystem, parseDate } from "@chakra-ui/react";

vi.mock("@tabler/icons-react", () => ({
  IconCalendarMinus: () => <span />,
  IconCalendarPlus: () => <span />,
  IconCalendarMonth: () => <span />,
}));

import CustomYearPicker from "./CustomYearPicker";

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

function renderWithChakra(ui: ReactElement) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

afterEach(() => {
  cleanup();
});

describe("CustomYearPicker", () => {
  it("shows the selected year", () => {
    renderWithChakra(<CustomYearPicker value={[parseDate("2026-01-01")]} />);
    expect(screen.getByRole("textbox")).toHaveValue("2026");
    expect(screen.getByPlaceholderText("yyyy")).toBeInTheDocument();
  });

  it("calls the previous and next year handlers", () => {
    const onPreviousYear = vi.fn();
    const onNextYear = vi.fn();
    renderWithChakra(
      <CustomYearPicker onPreviousYear={onPreviousYear} onNextYear={onNextYear} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Previous year" }));
    fireEvent.click(screen.getByRole("button", { name: "Next year" }));

    expect(onPreviousYear).toHaveBeenCalledTimes(1);
    expect(onNextYear).toHaveBeenCalledTimes(1);
  });

  it("renders the calendar trigger", () => {
    renderWithChakra(<CustomYearPicker />);
    expect(
      screen.getByRole("button", { name: "open calendar" }),
    ).toBeInTheDocument();
  });
});
