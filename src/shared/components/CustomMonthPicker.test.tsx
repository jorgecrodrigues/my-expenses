// @vitest-environment jsdom
import type { ReactElement } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import {
  ChakraProvider,
  defaultSystem,
  type DatePickerValueChangeDetails,
} from "@chakra-ui/react";
import { CalendarDate } from "@internationalized/date";

import {
  formatMonthPickerValue,
  parseMonthPickerValue,
} from "../utils/monthPickerValue";

vi.mock("@tabler/icons-react", () => ({
  IconCalendarMinus: () => <span>previous month</span>,
  IconCalendarPlus: () => <span>next month</span>,
  IconCalendarMonth: () => <span>open calendar</span>,
}));

import CustomMonthPicker from "./CustomMonthPicker";

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() { }
    unobserve() { }
    disconnect() { }
  };
});

function renderWithChakra(ui: ReactElement) {
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

  describe("formatMonthPickerValue", () => {
    it("formats month with zero padding", () => {
      expect(formatMonthPickerValue(new CalendarDate(2026, 3, 1))).toBe(
        "03/2026",
      );
    });

    it("pads single-digit months", () => {
      expect(formatMonthPickerValue(new CalendarDate(2026, 1, 1))).toBe(
        "01/2026",
      );
    });
  });

  describe("parseMonthPickerValue", () => {
    it("parses mm/yyyy with zero-padded month", () => {
      expect(parseMonthPickerValue("03/2026")).toEqual(
        new CalendarDate(2026, 3, 1),
      );
    });

    it("parses m/yyyy with a single-digit month", () => {
      expect(parseMonthPickerValue("3/2026")).toEqual(
        new CalendarDate(2026, 3, 1),
      );
    });

    it("returns undefined when the value does not match mm/yyyy", () => {
      expect(parseMonthPickerValue("")).toBeUndefined();
      expect(parseMonthPickerValue("2026-03")).toBeUndefined();
      expect(parseMonthPickerValue("003/2026")).toBeUndefined();
      expect(parseMonthPickerValue("13/26")).toBeUndefined();
    });
  });

  describe("DatePicker integration", () => {
    it("calls onValueChange after typing a valid mm/yyyy and blurring", async () => {
      const onValueChange = vi.fn();
      renderWithChakra(<CustomMonthPicker onValueChange={onValueChange} />);
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "08/2025" } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(onValueChange).toHaveBeenCalled();
      });

      const first = onValueChange.mock.calls[0][0] as DatePickerValueChangeDetails;
      expect(first.value?.[0]).toEqual(new CalendarDate(2025, 8, 1));
    });
  });
});
