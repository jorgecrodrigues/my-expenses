import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Combobox,
  Portal,
  useFilter,
  useListCollection,
} from "@chakra-ui/react";

interface AvailableYearSelectProps {
  value?: number[];
  onValueChange?: (
    details: Combobox.ValueChangeDetails<{ label: string; value: number }>
  ) => void;
}

export default function AvailableYearSelect({
  value,
  onValueChange,
}: AvailableYearSelectProps) {
  const { contains } = useFilter({ sensitivity: "base" });

  const { collection, filter, set } = useListCollection<{
    label: string;
    value: number;
  }>({
    initialItems: [],
    filter: contains,
  });

  const years = useQuery(api.expenses.getExpenseMinMaxYearDateOptions);

  const handleValueChange = (
    details: Combobox.ValueChangeDetails<{ label: string; value: number }>
  ) => {
    onValueChange?.(details);
  };

  React.useEffect(() => {
    set(
      years?.map?.((year) => ({ label: year.toString(), value: year })) ?? []
    );
  }, [years, set]);

  return (
    <Combobox.Root
      w={300}
      collection={collection}
      value={value as unknown as string[]}
      onInputValueChange={(e) => filter(e.inputValue)}
      onValueChange={handleValueChange}
    >
      <Combobox.Control>
        <Combobox.Input placeholder="Select year..." />
        <Combobox.IndicatorGroup>
          <Combobox.ClearTrigger />
          <Combobox.Trigger />
        </Combobox.IndicatorGroup>
      </Combobox.Control>
      <Portal>
        <Combobox.Positioner>
          <Combobox.Content>
            <Combobox.Empty>No years available</Combobox.Empty>
            {collection?.items?.map((item) => (
              <Combobox.Item key={item.value} item={item}>
                {item.label}
                <Combobox.ItemIndicator />
              </Combobox.Item>
            ))}
          </Combobox.Content>
        </Combobox.Positioner>
      </Portal>
    </Combobox.Root>
  );
}
