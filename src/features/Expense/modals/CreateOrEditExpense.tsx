"use client";

import React from "react";
import {
  Button,
  CloseButton,
  Dialog,
  Field,
  Flex,
  HStack,
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

type Expense = Doc<"expenses">;

interface CreateOrEditExpenseProps {
  expense?: Expense;
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

export default function CreateOrEditExpenseDialog(
  props: CreateOrEditExpenseProps
) {
  const { expense, ...rest } = props;

  const [open, setOpen] = React.useState<boolean>(false);

  const user = useQuery(api.users.viewer);

  const expenseCategoryOptions = useQuery(
    api.expenses.getExpenseCategoryOptions
  );
  const addExpense = useMutation(api.expenses.addExpense);
  const updateExpense = useMutation(api.expenses.updateExpense);

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

    if (expense) {
      updateExpense({
        ...(formValues as unknown as Omit<Expense, "userId">),
        id: expense._id,
        userId: expense.userId,
        amount: Number(sanitizedAmount),
      })
        .then(() => {
          setOpen(false);
          toaster.create({
            type: "success",
            title: "Expense updated successfully!",
          });
        })
        .catch((error) => {
          console.error(error);
          toaster.create({
            type: "error",
            title: "Failed to update expense.",
            description: error.message,
          });
        });
    } else {
      addExpense({
        ...(formValues as unknown as Omit<Expense, "userId">),
        userId: user?._id as Id<"users">,
        amount: Number(sanitizedAmount),
      })
        .then(() => {
          setOpen(false);
          toaster.create({
            type: "success",
            title: "Expense added successfully!",
          });
        })
        .catch((error) => {
          console.error(error);
          toaster.create({
            type: "error",
            title: "Failed to add expense.",
            description: error.message,
          });
        });
    }
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
        <Button
          variant="surface"
          colorPalette={props.expense ? "blue" : "green"}
          size="xs"
        >
          {props.expense ? "Edit Expense" : "Add Expense"}
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content as="form" onSubmit={handleSubmit}>
            <Dialog.Header>
              <Dialog.Title>
                {expense ? "Edit Expense" : "Add New Expense"}
              </Dialog.Title>
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
                  defaultValue={expense?.name}
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
                  defaultValue={expense?.description}
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
                    defaultValue={expense?.amount}
                    required
                  />
                  <Field.HelperText>
                    Please enter the expense amount.
                  </Field.HelperText>
                  <Field.ErrorText />
                </Field.Root>
                <Field.Root>
                  <Field.Label>
                    Date
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <Input
                    type="datetime-local"
                    name="date"
                    placeholder="Enter date"
                    defaultValue={
                      expense?.date || new Date().toISOString().slice(0, 16)
                    }
                    required
                  />
                  <Field.HelperText>
                    Please enter the expense date.
                  </Field.HelperText>
                  <Field.ErrorText />
                </Field.Root>
              </Flex>

              <CategoryCombobox
                initialItems={expenseCategoryOptions}
                selectedItem={expense?.category}
                inputProps={{
                  name: "category",
                  placeholder: "Enter category",
                  required: true,
                }}
              />

              <RadioCard.Root
                name="repeat"
                defaultValue={expense?.repeat || "none"}
              >
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
              <Button type="submit" variant="plain" colorScheme="blue">
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
