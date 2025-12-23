"use client";

import {
  Button,
  CloseButton,
  Dialog,
  IconButton,
  Portal,
} from "@chakra-ui/react";
import { useMutation } from "convex/react";
import { IconTrash } from "@tabler/icons-react";
import type { Doc } from "../../../../convex/_generated/dataModel";
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
        <IconButton
          aria-label="Delete Expense"
          title="Delete Expense"
          variant="ghost"
          colorPalette="red"
        >
          <IconTrash />
        </IconButton>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Confirm Deletion</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              Are you sure you want to delete the expense{" "}
              <b>"{expense.name}"</b>?
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
