// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";

import RecurrenceFields from "./RecurrenceFields";
import { getSchedule, type RecurrenceValue } from "../utils/recurrence";

const initialValue: RecurrenceValue = {
  start: "2025-05-10T12:00",
  frequency: "monthly",
  interval: "1",
  endMode: "count",
  count: "12",
  until: "2026-04-10",
};

function Harness({ amount = 100 }: { amount?: number }) {
  const [value, setValue] = React.useState(initialValue);
  return (
    <ChakraProvider value={defaultSystem}>
      <RecurrenceFields
        value={value}
        onChange={setValue}
        schedule={getSchedule(value)}
        amount={amount}
        originalDate={new Date(2025, 3, 10, 12)}
      />
    </ChakraProvider>
  );
}

const preview = () => screen.getByRole("status", { name: "Schedule preview" });

afterEach(() => {
  cleanup();
});

describe("RecurrenceFields", () => {
  it("previews the bills that will be created", () => {
    render(<Harness />);

    expect(preview()).toHaveTextContent("12 bills will be created");
    expect(preview()).toHaveTextContent(/R\$\s1\.200,00 in total/);
    expect(within(preview()).getByText("+6 more")).toBeInTheDocument();
  });

  it("shows the original due date as a reference", () => {
    render(<Harness />);
    expect(screen.getByText(/Original bill due on/)).toHaveTextContent(
      new Date(2025, 3, 10).toLocaleDateString("pt-BR", {
        dateStyle: "medium",
      }),
    );
  });

  it("omits the total when the amount is empty", () => {
    render(<Harness amount={NaN} />);
    expect(preview()).toHaveTextContent("12 bills will be created");
    expect(preview()).not.toHaveTextContent("in total");
  });

  it("applies quick picks for the number of bills", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Just once" }));
    expect(preview()).toHaveTextContent("1 bill will be created");
    expect(
      screen.getByRole("spinbutton", { name: "Number of bills" }),
    ).toHaveValue(1);

    fireEvent.click(screen.getByRole("button", { name: "6 months" }));
    expect(preview()).toHaveTextContent("6 bills will be created");
    expect(within(preview()).queryByText(/more$/)).not.toBeInTheDocument();
  });

  it("updates presets when the frequency or interval changes", () => {
    render(<Harness />);

    fireEvent.change(
      screen.getByRole("combobox", { name: "Repeat frequency" }),
      {
        target: { value: "weekly" },
      },
    );
    expect(screen.getByRole("button", { name: "4 weeks" })).toBeInTheDocument();

    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Repeat interval" }),
      {
        target: { value: "2" },
      },
    );
    expect(screen.getByRole("button", { name: "4 bills" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "weeks" })).toBeInTheDocument();
  });

  it("hides the end-of-year pick for yearly schedules", () => {
    render(<Harness />);
    expect(
      screen.getByRole("button", { name: "Until end of 2025" }),
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByRole("combobox", { name: "Repeat frequency" }),
      {
        target: { value: "yearly" },
      },
    );
    expect(
      screen.queryByRole("button", { name: "Until end of 2025" }),
    ).not.toBeInTheDocument();
  });

  it("switches to an end date", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "On a date" }));
    const lastDate = screen.getByLabelText("Last due date");
    expect(lastDate).toHaveValue("2026-04-10");
    expect(
      screen.queryByRole("spinbutton", { name: "Number of bills" }),
    ).not.toBeInTheDocument();

    fireEvent.change(lastDate, { target: { value: "2025-07-10" } });
    expect(preview()).toHaveTextContent("3 bills will be created");
  });

  it("uses the end of the start year as a quick pick", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Until end of 2025" }));
    expect(screen.getByLabelText("Last due date")).toHaveValue("2025-12-31");
    expect(preview()).toHaveTextContent("8 bills will be created");
  });

  it("warns when the schedule is truncated", () => {
    render(<Harness />);

    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Number of bills" }),
      {
        target: { value: "500" },
      },
    );
    expect(preview()).toHaveTextContent("120 bills will be created");
    expect(preview()).toHaveTextContent("Limited to 120 bills at a time.");
  });

  it("explains when no bills match the schedule", () => {
    render(<Harness />);

    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Number of bills" }),
      {
        target: { value: "" },
      },
    );
    expect(preview()).toHaveTextContent("No bills match this schedule.");
  });
});
