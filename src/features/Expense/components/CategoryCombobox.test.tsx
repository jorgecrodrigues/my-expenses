// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// CategoryCombobox uses Chakra UI Combobox primitives heavily.
// We mock the Chakra UI components to thin wrappers that expose
// what we care about: the label, the input, and the items list.

vi.mock("react-dom", async () => {
  const actual = await vi.importActual<typeof import("react-dom")>("react-dom");
  return { ...actual, flushSync: (fn: () => void) => fn() };
});

vi.mock("@chakra-ui/react", () => {
  // Minimal implementations that keep the combobox tree renderable.
  const useFilter = () => ({
    contains: (a: string, b: string) =>
      a.toLowerCase().includes(b.toLowerCase()),
  });

  const createListCollection = ({
    items,
    itemToString,
    itemToValue,
  }: {
    items: Array<{ value: string; label: string }>;
    itemToString: (item: { value: string; label: string }) => string;
    itemToValue: (item: { value: string; label: string }) => string;
  }) => ({
    items,
    stringify: (v: string) => {
      const found = items.find((i) => itemToValue(i) === v);
      return found ? itemToString(found) : v;
    },
  });

  const useCombobox = (opts: {
    collection: { items: Array<{ value: string; label: string }> };
    value: string[];
    onInputValueChange?: (details: {
      inputValue: string;
      reason: string;
    }) => void;
    onOpenChange?: (details: { reason: string; open: boolean }) => void;
    onValueChange?: (details: { value: string[] }) => void;
  }) => ({
    collection: opts.collection,
    inputValue: "",
    setHighlightValue: vi.fn(),
  });

  return {
    Field: {
      Root: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
      Label: ({ children }: { children: React.ReactNode }) => (
        <label>{children}</label>
      ),
      HelperText: ({ children }: { children: React.ReactNode }) => (
        <span>{children}</span>
      ),
      ErrorText: () => null,
    },
    Combobox: {
      RootProvider: ({
        children,
      }: {
        children: React.ReactNode;
        value?: unknown;
      }) => <div data-testid="combobox-root">{children}</div>,
      Control: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
      Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
        <input data-testid="combobox-input" {...props} />
      ),
      IndicatorGroup: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
      ClearTrigger: () => <button data-testid="combobox-clear">Clear</button>,
      Trigger: () => <button data-testid="combobox-trigger">Open</button>,
      Positioner: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
      Content: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="combobox-content">{children}</div>
      ),
      Empty: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="combobox-empty">{children}</div>
      ),
      Item: ({
        children,
        item,
      }: {
        children: React.ReactNode;
        item: { value: string; label: string };
      }) => (
        <div data-testid={`combobox-item-${item.value}`}>{children}</div>
      ),
      ItemIndicator: () => null,
    },
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useFilter,
    createListCollection,
    useCombobox,
  };
});

import CategoryCombobox from "./CategoryCombobox";

afterEach(() => {
  cleanup();
});

describe("CategoryCombobox", () => {
  it("renders the Category label", () => {
    render(<CategoryCombobox />);
    expect(screen.getByText("Category")).toBeInTheDocument();
  });

  it("renders the combobox input", () => {
    render(<CategoryCombobox />);
    expect(screen.getByTestId("combobox-input")).toBeInTheDocument();
  });

  it("renders the helper text", () => {
    render(<CategoryCombobox />);
    expect(
      screen.getByText("Please select the expense category."),
    ).toBeInTheDocument();
  });

  it("renders the clear trigger", () => {
    render(<CategoryCombobox />);
    expect(screen.getByTestId("combobox-clear")).toBeInTheDocument();
  });

  it("renders the open trigger", () => {
    render(<CategoryCombobox />);
    expect(screen.getByTestId("combobox-trigger")).toBeInTheDocument();
  });

  it("renders provided initial items", () => {
    const items = [
      { value: "food", label: "Food" },
      { value: "travel", label: "Travel" },
    ];
    render(<CategoryCombobox initialItems={items} />);
    expect(screen.getByTestId("combobox-item-food")).toBeInTheDocument();
    expect(screen.getByTestId("combobox-item-travel")).toBeInTheDocument();
  });

  it("renders 'No categories found' empty state element", () => {
    render(<CategoryCombobox />);
    expect(screen.getByTestId("combobox-empty")).toBeInTheDocument();
    expect(screen.getByText("No categories found.")).toBeInTheDocument();
  });

  it("forwards inputProps to the combobox input", () => {
    render(
      <CategoryCombobox
        inputProps={{ name: "category", placeholder: "Pick a category" }}
      />,
    );
    const input = screen.getByTestId("combobox-input");
    expect(input).toHaveAttribute("name", "category");
    expect(input).toHaveAttribute("placeholder", "Pick a category");
  });

  it("renders without crashing when no props are given", () => {
    expect(() => render(<CategoryCombobox />)).not.toThrow();
  });
});
