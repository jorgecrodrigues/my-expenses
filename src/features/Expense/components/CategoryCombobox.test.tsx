// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";

import CategoryCombobox from "./CategoryCombobox";

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  cleanup();
});

function renderWithChakra(ui: React.ReactElement) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

/** Opens the combobox list (Ark/Chakra: focus input, then ArrowDown). */
async function openCombobox(user: ReturnType<typeof userEvent.setup>) {
  const input = screen.getByRole("combobox");
  await user.click(input);
  await user.keyboard("{ArrowDown}");
}

describe("CategoryCombobox", () => {
  it("renders the category label and helper text", () => {
    renderWithChakra(
      <CategoryCombobox
        initialItems={[{ value: "food", label: "Food" }]}
        inputProps={{ placeholder: "Enter category" }}
      />,
    );

    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(
      screen.getByText("Please select the expense category."),
    ).toBeInTheDocument();
  });

  it("exposes a combobox input with aria-describedby pointing at helper text", () => {
    renderWithChakra(
      <CategoryCombobox
        initialItems={[{ value: "food", label: "Food" }]}
        inputProps={{ placeholder: "Enter category" }}
      />,
    );

    const input = screen.getByRole("combobox");
    const helper = screen.getByText("Please select the expense category.");
    expect(input).toHaveAttribute(
      "aria-describedby",
      helper.getAttribute("id"),
    );
  });

  it("shows the placeholder on the combobox input", () => {
    renderWithChakra(
      <CategoryCombobox
        initialItems={[{ value: "food", label: "Food" }]}
        inputProps={{ placeholder: "Enter category" }}
      />,
    );

    expect(screen.getByPlaceholderText("Enter category")).toBeInTheDocument();
  });

  it("shows initial list options when the list opens", async () => {
    const user = userEvent.setup();
    renderWithChakra(
      <CategoryCombobox
        initialItems={[
          { value: "food", label: "Food" },
          { value: "travel", label: "Travel" },
        ]}
        inputProps={{ placeholder: "Enter category" }}
      />,
    );

    await openCombobox(user);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Food" })).toBeInTheDocument();
    });
    expect(screen.getByRole("option", { name: "Travel" })).toBeInTheDocument();
  });

  it("filters options when typing in the input", async () => {
    const user = userEvent.setup();
    renderWithChakra(
      <CategoryCombobox
        initialItems={[
          { value: "food", label: "Food" },
          { value: "travel", label: "Travel" },
        ]}
        inputProps={{ placeholder: "Enter category" }}
      />,
    );

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.clear(input);
    await user.keyboard("tra");

    await waitFor(() => {
      expect(
        screen.getByRole("option", { name: "Travel" }),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("option", { name: "Food" }),
    ).not.toBeInTheDocument();
  });

  it("shows no categories message when there are no initial items and the list is open", async () => {
    const user = userEvent.setup();
    renderWithChakra(
      <CategoryCombobox
        initialItems={[]}
        inputProps={{ placeholder: "Enter category" }}
      />,
    );

    await openCombobox(user);

    await waitFor(() => {
      expect(screen.getByText("No categories found.")).toBeInTheDocument();
    });
  });

  it("reflects selectedItem as the current value", async () => {
    renderWithChakra(
      <CategoryCombobox
        initialItems={[{ value: "food", label: "Food" }]}
        selectedItem="food"
        inputProps={{ placeholder: "Enter category" }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toHaveValue("Food");
    });
  });

  it("forwards input props such as name and required to the combobox input", () => {
    renderWithChakra(
      <CategoryCombobox
        initialItems={[{ value: "food", label: "Food" }]}
        inputProps={{
          name: "category",
          placeholder: "Enter category",
          required: true,
        }}
      />,
    );

    const input = screen.getByPlaceholderText("Enter category");
    expect(input).toHaveAttribute("name", "category");
    expect(input).toBeRequired();
  });

  it("renders clear and trigger controls next to the input", () => {
    renderWithChakra(
      <CategoryCombobox
        initialItems={[{ value: "food", label: "Food" }]}
        inputProps={{ placeholder: "Enter category" }}
      />,
    );

    const control = screen.getByRole("combobox").closest(
      '[data-part="control"]',
    );
    expect(control).toBeTruthy();
    const buttons = within(control as HTMLElement).getAllByRole("button", {
      hidden: true,
    });
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    expect(
      buttons.some((b) =>
        (b.getAttribute("aria-label") ?? "").toLowerCase().includes("clear"),
      ),
    ).toBe(true);
  });
});
