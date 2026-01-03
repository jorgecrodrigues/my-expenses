"use client";

import React from "react";
import {
  Button,
  CloseButton,
  Dialog,
  Field,
  Flex,
  HStack,
  IconButton,
  Input,
  Portal,
  RadioCard,
} from "@chakra-ui/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import CategoryCombobox from "../components/CategoryCombobox";
import BRLCurrencyInput from "../../../shared/components/BRLCurrencyInput";
import { toaster } from "../../../components/ui/toaster";
import { IconCopyPlusFilled } from "@tabler/icons-react";

type Expense = Doc<"expenses">;

interface DuplicateExpenseProps {
  expense: Expense;
}

type RepeatOption = {
  value: "none" | "daily" | "weekly" | "monthly" | "yearly";
  title: string;
  description: string;
};

const repeatOptions: RepeatOption[] = [
  { value: "none", title: "None", description: "Does not repeat" },
  { value: "daily", title: "Daily", description: "Repeats every day" },
  { value: "weekly", title: "Weekly", description: "Repeats every week" },
  { value: "monthly", title: "Monthly", description: "Repeats every month" },
  { value: "yearly", title: "Yearly", description: "Repeats every year" },
];

export default function DuplicateExpenseDialog(props: DuplicateExpenseProps) {
  const { expense, ...rest } = props;

  const [open, setOpen] = React.useState<boolean>(false);

  const user = useQuery(api.users.viewer);

  const expenseCategoryOptions = useQuery(
    api.expenses.getExpenseCategoryOptions
  );
  const addDuplicateExpense = useMutation(api.expenses.addDuplicateExpense);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const formData = new FormData(event.target as HTMLFormElement);
    const formValues = Object.fromEntries(formData.entries());

    const sanitizedAmount = formValues.amount
      .toString()
      .replace(/[^\d.,]/g, "")
      .trim()
      .replace(".", "")
      .replace(",", ".");

    addDuplicateExpense({
      ...(formValues as unknown as Omit<Expense, "userId">),
      userId: user?._id as Id<"users">,
      amount: Number(sanitizedAmount),
      date: expense.date,
      repeat: formValues.repeat as
        | "none"
        | "daily"
        | "weekly"
        | "monthly"
        | "yearly",
      repeatStartDate: formValues.repeatStartDate as string,
      repeatEndDate: formValues.repeatEndDate as string,
    })
      .then(() => {
        setOpen(false);
        toaster.create({
          type: "success",
          title: "Expense duplicated successfully.",
          duration: 2000,
        });
      })
      .catch((error) => {
        console.error(error);
        toaster.create({
          type: "error",
          title: "Failed to duplicate expense.",
          description: error.message,
          duration: 4000,
        });
      });
  };

  return (
    <Dialog.Root
      lazyMount
      open={open}
      placement="center"
      closeOnInteractOutside={false}
      size={{ mdDown: "full", md: "md" }}
      onOpenChange={(e) => setOpen(e.open)}
      {...rest}
    >
      <Dialog.Trigger asChild>
        <IconButton
          aria-label="Duplicate Expense"
          title="Duplicate Expense"
          variant="ghost"
        >
          <IconCopyPlusFilled />
        </IconButton>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content as="form" onSubmit={handleSubmit}>
            <Dialog.Header>
              <Dialog.Title>Duplicate Expense</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body display="flex" flexDirection="column" gap={4}>
              <Field.Root>
                <Field.Label>
                  Name
                  <Field.RequiredIndicator />
                </Field.Label>
                <Input
                  type="text"
                  name="name"
                  placeholder="Enter name"
                  defaultValue={expense.name}
                  required
                />
                <Field.HelperText>
                  Please enter the expense name.
                </Field.HelperText>
                <Field.ErrorText />
              </Field.Root>
              <Field.Root>
                <Field.Label>
                  Description
                  <Field.RequiredIndicator />
                </Field.Label>
                <Input
                  type="text"
                  name="description"
                  placeholder="Enter description"
                  defaultValue={expense.description}
                  required
                />
                <Field.HelperText>
                  Please enter the expense description.
                </Field.HelperText>
                <Field.ErrorText />
              </Field.Root>
              <Flex gap={2}>
                <Field.Root>
                  <Field.Label>
                    Amount (BRL)
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <BRLCurrencyInput
                    type="text"
                    name="amount"
                    placeholder="Enter amount"
                    defaultValue={expense.amount}
                    required
                  />
                  <Field.HelperText>
                    Please enter the expense amount.
                  </Field.HelperText>
                  <Field.ErrorText />
                </Field.Root>
                <CategoryCombobox
                  initialItems={expenseCategoryOptions}
                  selectedItem={expense.category}
                  inputProps={{
                    name: "category",
                    placeholder: "Enter category",
                    required: true,
                  }}
                />
              </Flex>

              <HStack>
                <Field.Root>
                  <Field.Label>
                    Start Date
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <Input
                    type="datetime-local"
                    name="repeatStartDate"
                    placeholder="Enter start date"
                    defaultValue={new Date(expense.date)
                      .toISOString()
                      .slice(0, 16)}
                    required
                  />
                  <Field.HelperText>
                    Please enter the expense date.
                  </Field.HelperText>
                  <Field.ErrorText />
                </Field.Root>
                <Field.Root>
                  <Field.Label>
                    End Date
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <Input
                    type="datetime-local"
                    name="repeatEndDate"
                    placeholder="Enter end date"
                    defaultValue={new Date(expense.date)
                      .toISOString()
                      .slice(0, 16)}
                    required
                  />
                  <Field.HelperText>
                    Please enter the expense date.
                  </Field.HelperText>
                  <Field.ErrorText />
                </Field.Root>
              </HStack>

              <RadioCard.Root name="repeat" defaultValue={"none"}>
                <RadioCard.Label>Repeat</RadioCard.Label>
                <HStack align="stretch" wrap="wrap">
                  {repeatOptions.map((option) => (
                    <RadioCard.Item key={option.value} value={option.value}>
                      <RadioCard.ItemHiddenInput />
                      <RadioCard.ItemControl>
                        <RadioCard.ItemContent>
                          <RadioCard.ItemText>
                            {option.title}
                          </RadioCard.ItemText>
                          <RadioCard.ItemDescription>
                            {option.description}
                          </RadioCard.ItemDescription>
                        </RadioCard.ItemContent>
                        <RadioCard.ItemIndicator />
                      </RadioCard.ItemControl>
                    </RadioCard.Item>
                  ))}
                </HStack>
              </RadioCard.Root>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">Cancel</Button>
              </Dialog.ActionTrigger>
              <Button type="submit" variant="solid" colorScheme="blue">
                {expense ? "Save Changes" : "Add Expense"}
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
