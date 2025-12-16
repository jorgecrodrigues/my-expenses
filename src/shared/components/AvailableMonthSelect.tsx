import {
  Combobox,
  Portal,
  useFilter,
  useListCollection,
} from "@chakra-ui/react";

interface AvailableMonthSelectProps {
  value?: number[];
  onValueChange?: (
    details: Combobox.ValueChangeDetails<{ label: string; value: number }>
  ) => void;
}

export default function AvailableMonthSelect({
  value,
  onValueChange,
}: AvailableMonthSelectProps) {
  const { contains } = useFilter({ sensitivity: "base" });

  const { collection, filter } = useListCollection<{
    label: string;
    value: number;
  }>({
    initialItems: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ].map((month, index) => ({
      label: month,
      value: index + 1,
    })),
    filter: contains,
  });

  const handleValueChange = (
    details: Combobox.ValueChangeDetails<{ label: string; value: number }>
  ) => {
    onValueChange?.(details);
  };

  return (
    <Combobox.Root
      w={400}
      collection={collection}
      value={value as unknown as string[]}
      onInputValueChange={(e) => filter(e.inputValue)}
      onValueChange={handleValueChange}
    >
      <Combobox.Control>
        <Combobox.Input placeholder="Select month..." />
        <Combobox.IndicatorGroup>
          <Combobox.ClearTrigger />
          <Combobox.Trigger />
        </Combobox.IndicatorGroup>
      </Combobox.Control>
      <Portal>
        <Combobox.Positioner>
          <Combobox.Content>
            <Combobox.Empty>No months available</Combobox.Empty>
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
