// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { CalendarDate } from "@internationalized/date";

vi.mock("@tabler/icons-react", () => ({
  IconCalendarMinus: () => <span>previous month</span>,
  IconCalendarPlus: () => <span>next month</span>,
  IconCalendarMonth: () => <span>open calendar</span>,
}));

import CustomMonthPicker from "./CustomMonthPicker";

function renderWithChakra(ui: React.ReactElement) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

afterEach(() => {
  cleanup();
});

describe("CustomMonthPicker", () => {
  describe("rendering", () => {
    it("renders a text input", () => {
      renderWithChakra(<CustomMonthPicker />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("shows mm/yyyy placeholder", () => {
      renderWithChakra(<CustomMonthPicker />);
      expect(screen.getByPlaceholderText("mm/yyyy")).toBeInTheDocument();
    });

    it("renders the previous month button", () => {
      renderWithChakra(<CustomMonthPicker />);
      expect(
        screen.getByRole("button", { name: "previous month" }),
      ).toBeInTheDocument();
    });

    it("renders the next month button", () => {
      renderWithChakra(<CustomMonthPicker />);
      expect(
        screen.getByRole("button", { name: "next month" }),
      ).toBeInTheDocument();
    });

    it("renders the calendar trigger button", () => {
      renderWithChakra(<CustomMonthPicker />);
      expect(
        screen.getByRole("button", { name: "open calendar" }),
      ).toBeInTheDocument();
    });
  });

  describe("value display", () => {
    it("shows the formatted month/year when a value is provided", () => {
      renderWithChakra(
        <CustomMonthPicker value={[new CalendarDate(2026, 3, 1)]} />,
      );
      expect(screen.getByRole("textbox")).toHaveValue("03/2026");
    });

    it("shows empty input when no value is provided", () => {
      renderWithChakra(<CustomMonthPicker />);
      expect(screen.getByRole("textbox")).toHaveValue("");
    });
  });

  describe("navigation callbacks", () => {
    it("calls onPreviousMonth when the previous month button is clicked", () => {
      const onPreviousMonth = vi.fn();
      renderWithChakra(<CustomMonthPicker onPreviousMonth={onPreviousMonth} />);
      fireEvent.click(screen.getByRole("button", { name: "previous month" }));
      expect(onPreviousMonth).toHaveBeenCalledTimes(1);
    });

    it("calls onNextMonth when the next month button is clicked", () => {
      const onNextMonth = vi.fn();
      renderWithChakra(<CustomMonthPicker onNextMonth={onNextMonth} />);
      fireEvent.click(screen.getByRole("button", { name: "next month" }));
      expect(onNextMonth).toHaveBeenCalledTimes(1);
    });

    it("does not throw when onPreviousMonth is not provided", () => {
      renderWithChakra(<CustomMonthPicker />);
      expect(() =>
        fireEvent.click(screen.getByRole("button", { name: "previous month" })),
      ).not.toThrow();
    });

    it("does not throw when onNextMonth is not provided", () => {
      renderWithChakra(<CustomMonthPicker />);
      expect(() =>
        fireEvent.click(screen.getByRole("button", { name: "next month" })),
      ).not.toThrow();
    });
  });
});
