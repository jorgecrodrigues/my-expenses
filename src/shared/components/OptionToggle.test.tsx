// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import OptionToggle from "./OptionToggle";

function renderWithChakra(ui: React.ReactElement) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

afterEach(() => {
  cleanup();
});

describe("OptionToggle", () => {
  const options = [
    { value: "a", label: "Option A" },
    { value: "b", label: "Option B" },
  ];

  it("renders a labelled group with the active option pressed", () => {
    renderWithChakra(
      <OptionToggle
        label="View"
        value="a"
        options={options}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("group", { name: "View" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Option A" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Option B" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("calls onChange with the clicked option", () => {
    const onChange = vi.fn();
    renderWithChakra(
      <OptionToggle
        label="View"
        value="a"
        options={options}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Option B" }));
    expect(onChange).toHaveBeenCalledWith("b");
  });
});
