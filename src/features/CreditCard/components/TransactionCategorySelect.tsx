import React from "react";
import { useMutation } from "convex/react";
import { toaster } from "@/components/ui/toaster";
import CategoryCombobox from "@/shared/components/CategoryCombobox";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { categoryLabel, type CategoryOption } from "../utils/creditCard";

export default function TransactionCategorySelect({
  transactionId,
  category,
  description,
  options,
}: {
  transactionId: Id<"creditCardTransactions">;
  category: string;
  description: string;
  options: CategoryOption[];
}) {
  const updateCategory = useMutation(
    api.creditCardStatements.updateTransactionCategory,
  );
  const [saving, setSaving] = React.useState(false);
  // Remounting drops a choice the server rejected and shows the saved one.
  const [resetKey, setResetKey] = React.useState(0);

  const items = React.useMemo(
    () =>
      options.some((option) => option.value === category)
        ? options
        : [...options, { value: category, label: categoryLabel(category) }],
    [options, category],
  );

  const handleSelect = async (next: string) => {
    if (next === category) return;
    setSaving(true);
    try {
      await updateCategory({ transactionId, category: next });
    } catch (error) {
      setResetKey((key) => key + 1);
      toaster.create({
        type: "error",
        title: "Could not change the category",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <CategoryCombobox
      key={resetKey}
      initialItems={items}
      selectedItem={category}
      label={null}
      helperText={null}
      size="xs"
      clearable={false}
      disabled={saving}
      onSelect={handleSelect}
      inputProps={{
        "aria-label": `Category of ${description}`,
        placeholder: "Category",
        minW: "36",
      }}
    />
  );
}
