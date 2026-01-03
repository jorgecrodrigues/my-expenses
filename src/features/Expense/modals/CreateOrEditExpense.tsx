"use client";

import React from "react";
import {
  Button,
  CloseButton,
  Dialog,
  Field,
  HStack,
  IconButton,
  Input,
  Portal,
} from "@chakra-ui/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import CategoryCombobox from "../components/CategoryCombobox";
import BRLCurrencyInput from "../../../shared/components/BRLCurrencyInput";
import { toaster } from "../../../components/ui/toaster";
import { IconEdit, IconPlus } from "@tabler/icons-react";

type Expense = Doc<"expenses">;

interface CreateOrEditExpenseProps {
  expense?: Expense;
}

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
            duration: 2000,
          });
        })
        .catch((error) => {
          console.error(error);
          toaster.create({
            type: "error",
            title: "Failed to update expense.",
            description: error.message,
            duration: 4000,
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
            duration: 2000,
          });
        })
        .catch((error) => {
          console.error(error);
          toaster.create({
            type: "error",
            title: "Failed to add expense.",
            description: error.message,
            duration: 4000,
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
        {props.expense ? (
          <IconButton
            aria-label="Edit Expense"
            title="Edit Expense"
            variant="ghost"
          >
            <IconEdit />
          </IconButton>
        ) : (
          <Button variant="surface" colorPalette="green" size="sm">
            Add Expense <IconPlus />
          </Button>
        )}
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

              <HStack>
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
                      expense?.date
                        ? new Date(expense.date).toISOString().slice(0, 16)
                        : new Date().toISOString().slice(0, 16)
                    }
                    required
                  />
                  <Field.HelperText>
                    Please enter the expense date.
                  </Field.HelperText>
                  <Field.ErrorText />
                </Field.Root>
              </HStack>

              <HStack>
                <CategoryCombobox
                  initialItems={expenseCategoryOptions}
                  selectedItem={expense?.category}
                  inputProps={{
                    name: "category",
                    placeholder: "Enter category",
                    required: true,
                  }}
                />
                <Field.Root>
                  <Field.Label>
                    Paid At
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <Input
                    type="datetime-local"
                    name="paidAt"
                    placeholder="Enter date"
                    defaultValue={
                      expense?.paidAt
                        ? new Date(expense.paidAt).toISOString().slice(0, 16)
                        : ""
                    }
                  />
                  <Field.HelperText>
                    Please enter the paid at date.
                  </Field.HelperText>
                  <Field.ErrorText />
                </Field.Root>
              </HStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="plain">Cancel</Button>
              </Dialog.ActionTrigger>
              <Button
                type="submit"
                variant="solid"
                colorPalette={expense ? "blue" : "green"}
              >
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
