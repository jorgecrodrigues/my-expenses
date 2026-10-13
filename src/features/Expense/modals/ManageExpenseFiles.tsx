"use client";

import React from "react";
import {
  CloseButton,
  Dialog,
  Icon,
  IconButton,
  Portal,
  Text,
} from "@chakra-ui/react";
import { IconArchiveFilled } from "@tabler/icons-react";
import { useQuery } from "convex/react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import {
  dialogBackdropMotion,
  dialogContentMotion,
} from "@/shared/animation/chakraMotion";
import ExpenseFileUploader from "../components/ExpenseFileUploader";
import ExpenseFilesTable from "../components/ExpenseFilesTable";

interface ManageExpenseFilesProps {
  expense: Doc<"expenses">;
}

export default function ManageExpenseFiles({
  expense,
  ...rest
}: ManageExpenseFilesProps) {
  const [open, setOpen] = React.useState(false);

  const files = useQuery(
    api.expensesfiles.getExpenseFiles,
    open ? { expenseId: expense._id } : "skip",
  );

  return (
    <Dialog.Root
      lazyMount
      unmountOnExit
      open={open}
      placement="center"
      closeOnInteractOutside={false}
      scrollBehavior="inside"
      size={{ mdDown: "full", md: "xl" }}
      onOpenChange={(e) => setOpen(e.open)}
      {...rest}
    >
      <Dialog.Trigger asChild>
        <IconButton
          aria-label="Manage Expense Files"
          title="Manage Expense Files"
          variant="ghost"
          colorPalette="blue"
        >
          <IconArchiveFilled />
        </IconButton>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.800" {...dialogBackdropMotion} />
        <Dialog.Positioner>
          <Dialog.Content {...dialogContentMotion}>
            <Dialog.Header flexDirection="column" alignItems="flex-start" gap={1}>
              <Dialog.Title alignItems="center" display="flex" gap={2}>
                <Icon as={IconArchiveFilled} boxSize={6} />
                Manage Expense Files
              </Dialog.Title>
              <Text color="fg.muted" fontSize="sm">
                <b>{expense.name}</b> ·{" "}
                {new Date(expense.date).toLocaleDateString("pt-BR", {
                  dateStyle: "long",
                })}
              </Text>
            </Dialog.Header>
            <Dialog.Body display="flex" flexDirection="column" gap={6}>
              <ExpenseFileUploader expenseId={expense._id} />
              <ExpenseFilesTable files={files} />
            </Dialog.Body>
            <Dialog.CloseTrigger asChild>
              <CloseButton />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
