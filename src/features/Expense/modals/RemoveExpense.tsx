"use client";

import { Button, CloseButton, Dialog, Portal } from "@chakra-ui/react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

type Expense = Doc<"expenses">;

interface RemoveExpenseProps {
  expense: Expense;
}

export default function RemoveExpenseDialog(props: RemoveExpenseProps) {
  const { expense, ...rest } = props;

  const deleteExpense = useMutation(api.expenses.deleteExpense);

  const handleDelete = () => {
    deleteExpense({ id: expense._id });
  };

  return (
    <Dialog.Root
      lazyMount
      placement="center"
      closeOnInteractOutside={false}
      size={{ mdDown: "full", md: "md" }}
      {...rest}
    >
      <Dialog.Trigger asChild>
        <Button variant="surface" colorPalette="red" size="xs">
          Delete
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Confirm Deletion</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              Are you sure you want to delete the expense "{expense.name}"?
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline" size="xs">
                  Cancel
                </Button>
              </Dialog.ActionTrigger>
              <Button
                variant="surface"
                colorPalette="red"
                size="xs"
                onClick={handleDelete}
              >
                Delete
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
