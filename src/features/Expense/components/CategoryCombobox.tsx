import {
  Field,
  useFilter,
  createListCollection,
  Combobox,
  Portal,
  useCombobox,
} from "@chakra-ui/react";
import React from "react";
import { flushSync } from "react-dom";

export interface CategoryComboboxItem {
  value: string;
  label: string;
  isNew?: boolean;
}

interface CategoryComboboxProps {
  initialItems?: { value: string; label: string }[];
  selectedItem?: string;
  inputProps?: Combobox.InputProps;
  /** Called when the user commits a newly typed category (not from initial items). */
  onCreateItem?: (item: CategoryComboboxItem) => void;
}

export default function CategoryCombobox({
  initialItems = [],
  selectedItem,
  inputProps,
  onCreateItem,
}: CategoryComboboxProps) {
  const { combobox } = useCreatableCombobox({
    initialItems,
    selectedItem,
    createOptionMode: "prepend",
    onCreateItem,
  });

  return (
    <Field.Root>
      <Field.Label>Category</Field.Label>
      <Combobox.RootProvider value={combobox}>
        <Combobox.Control>
          <Combobox.Input {...inputProps} />
          <Combobox.IndicatorGroup>
            <Combobox.ClearTrigger />
            <Combobox.Trigger />
          </Combobox.IndicatorGroup>
        </Combobox.Control>
        <Field.HelperText>Please select the expense category.</Field.HelperText>
        <Field.ErrorText />

        <Portal>
          <Combobox.Positioner style={{ zIndex: 99999 }}>
            <Combobox.Content>
              <Combobox.Empty>No categories found.</Combobox.Empty>
              {combobox.collection.items.map((item) => (
                <Combobox.Item key={item.value} item={item}>
                  {item.label}
                  <Combobox.ItemIndicator />
                </Combobox.Item>
              ))}
            </Combobox.Content>
          </Combobox.Positioner>
        </Portal>
      </Combobox.RootProvider>
    </Field.Root>
  );
}

interface Item {
  value: string;
  label: string;
  isNew?: boolean;
}

type CreateOptionMode = "append" | "prepend";

interface UseCreatableComboboxProps {
  initialItems: Item[];
  selectedItem?: string;
  onCreateItem?: (item: Item) => void;
  createOptionMode: CreateOptionMode;
}

const NEW_ITEM_VALUE_PREFIX = "___new_item___";

const isNewItemValue = (value: string) => value === NEW_ITEM_VALUE_PREFIX;

const createNewItem = (value: string): Item => ({
  label: value,
  value: NEW_ITEM_VALUE_PREFIX,
});

const replaceNewItemValue = (values: string[], value: string) =>
  values.map((v) => (v === NEW_ITEM_VALUE_PREFIX ? value : v));

const getNewItemData = (inputValue: string): Item => ({
  label: inputValue,
  value: inputValue,
  isNew: true,
});

const updateItems = (v: Item[], i: Item, mode: CreateOptionMode) => {
  return mode === "append" ? [...v, i] : [i, ...v];
};

function useCreatableCombobox(props: UseCreatableComboboxProps) {
  const { initialItems, selectedItem, onCreateItem, createOptionMode } = props;

  const [items, setItems] = React.useState<Item[]>(initialItems);
  const itemsRef = React.useRef<Item[]>(initialItems);

  const { contains } = useFilter({ sensitivity: "base" });

  const filterFn = (item: Item, query: string) =>
    !isNewItemValue(item.value) && contains(item.label, query);

  const [selectedValue, setSelectedValue] = React.useState<string[]>([]);
  const selectedValueRef = React.useRef<string[]>([]);

  const collection = React.useMemo(
    () =>
      createListCollection({
        items,
        itemToString: (item) => item.label,
        itemToValue: (item) => item.value,
      }),
    [items]
  );

  const isValidNewItem = (inputValue: string) => {
    const exactOptionMatch =
      items.filter(
        (item) => item.label.toLowerCase() === inputValue.toLowerCase()
      ).length > 0;
    return !exactOptionMatch && inputValue.trim().length > 0;
  };

  const filter = (query: string) => {
    if (isValidNewItem(query)) {
      const newItem = createNewItem(query);
      const filtered = itemsRef.current.filter((item) => filterFn(item, query));
      setItems(updateItems(filtered, newItem, createOptionMode));
      return;
    }

    if (query.trim().length === 0) {
      setItems(itemsRef.current);
    } else {
      const filtered = itemsRef.current.filter((item) => filterFn(item, query));
      setItems(filtered);
    }
  };

  const selectNewItem = (inputValue: string) => {
    const newItem = getNewItemData(inputValue);
    const filtered = itemsRef.current.filter(
      (item) => !isNewItemValue(item.value)
    );

    itemsRef.current = updateItems(filtered, newItem, createOptionMode);
    setItems(itemsRef.current);
    onCreateItem?.(newItem);
  };

  const combobox = useCombobox({
    collection,
    allowCustomValue: true,
    onInputValueChange: (details: Combobox.InputValueChangeDetails) => {
      const { inputValue, reason } = details;

      if (reason === "input-change" || reason === "item-select") {
        flushSync(() => filter(inputValue));
      }
    },
    onOpenChange(details) {
      const { reason, open } = details;

      if (reason === "trigger-click") {
        setItems(itemsRef.current);
      }

      if (!open && selectedValueRef.current.length > 0) {
        const inputValue =
          collection.stringify(selectedValueRef.current[0]) || "";
        combobox.setHighlightValue(inputValue);
      }
    },
    value: selectedValue,
    onValueChange: (details) => {
      const { value } = details;
      const inputValue = combobox.inputValue;
      const next = replaceNewItemValue(value, inputValue);
      selectedValueRef.current = next;
      setSelectedValue(next);
      if (value.includes(NEW_ITEM_VALUE_PREFIX)) {
        selectNewItem(inputValue);
      }
    },
  });

  React.useEffect(() => {
    itemsRef.current = initialItems;
    setItems(initialItems);
  }, [initialItems]);

  React.useEffect(() => {
    if (selectedItem) {
      const next = [selectedItem];
      selectedValueRef.current = next;
      setSelectedValue(next);
    }
  }, [selectedItem]);

  return { combobox };
}
