// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { Id } from "../../../../convex/_generated/dataModel";

const { updateMock, toasterMock } = vi.hoisted(() => ({
  updateMock: vi.fn(),
  toasterMock: { create: vi.fn() },
}));

vi.mock("convex/react", () => ({
  useMutation: () => updateMock,
}));

vi.mock("@/components/ui/toaster", () => ({ toaster: toasterMock }));

vi.mock("@/shared/components/CategoryCombobox", () => ({
  default: ({
    initialItems,
    selectedItem,
    disabled,
    onSelect,
    inputProps,
  }: {
    initialItems: { value: string; label: string }[];
    selectedItem: string;
    disabled?: boolean;
    onSelect: (value: string) => void;
    inputProps: { "aria-label": string };
  }) => (
    <div>
      <select
        aria-label={inputProps["aria-label"]}
        value={selectedItem}
        disabled={disabled}
        onChange={(e) => onSelect(e.target.value)}
      >
        {initialItems.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      <button type="button" onClick={() => onSelect("Pets")}>
        Create Pets
      </button>
    </div>
  ),
}));

import TransactionCategorySelect from "./TransactionCategorySelect";

const transactionId = "transaction1" as Id<"creditCardTransactions">;
const options = [
  { value: "food", label: "Food" },
  { value: "groceries", label: "Groceries" },
];

function renderSelect(category = "groceries") {
  render(
    <TransactionCategorySelect
      transactionId={transactionId}
      category={category}
      description="Oxxo"
      options={options}
    />,
  );
  return screen.getByRole("combobox", { name: "Category of Oxxo" });
}

describe("TransactionCategorySelect", () => {
  beforeEach(() => {
    updateMock.mockReset();
    toasterMock.create.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows the current category among the options", () => {
    const select = renderSelect();

    expect(select).toHaveValue("groceries");
    expect(screen.getByRole("option", { name: "Food" })).toBeInTheDocument();
  });

  it("adds the current category when it is not among the options", () => {
    const select = renderSelect("Gym");

    expect(select).toHaveValue("Gym");
    expect(screen.getByRole("option", { name: "Gym" })).toBeInTheDocument();
  });

  it("saves an existing category", async () => {
    updateMock.mockResolvedValue("food");
    const select = renderSelect();

    fireEvent.change(select, { target: { value: "food" } });

    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith({
        transactionId,
        category: "food",
      }),
    );
    expect(toasterMock.create).not.toHaveBeenCalled();
  });

  it("saves a newly typed category", async () => {
    updateMock.mockResolvedValue("Pets");
    renderSelect();

    fireEvent.click(screen.getByRole("button", { name: "Create Pets" }));

    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith({
        transactionId,
        category: "Pets",
      }),
    );
  });

  it("does not save when the category did not change", () => {
    const select = renderSelect();

    fireEvent.change(select, { target: { value: "groceries" } });

    expect(updateMock).not.toHaveBeenCalled();
  });

  it("shows an error toast when saving fails", async () => {
    updateMock.mockRejectedValue(new Error("Category name is required"));
    const select = renderSelect();

    fireEvent.change(select, { target: { value: "food" } });

    await waitFor(() =>
      expect(toasterMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          description: "Category name is required",
        }),
      ),
    );
    expect(
      screen.getByRole("combobox", { name: "Category of Oxxo" }),
    ).toHaveValue("groceries");
  });
});
