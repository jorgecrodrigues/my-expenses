import React from "react";
import { Button, CloseButton, Dialog, Portal, Text } from "@chakra-ui/react";
import {
  dialogBackdropMotion,
  dialogContentMotion,
} from "@/shared/animation/chakraMotion";
import type { CategoryOption } from "../utils/creditCard";
import PeriodTransactionsList, {
  type PeriodTransaction,
} from "../components/PeriodTransactionsList";

const PER_PAGE = 50;

interface PeriodTransactionsDialogProps {
  transactions: PeriodTransaction[];
  categoryOptions: CategoryOption[];
  /** Describes the selection, e.g. "Mar 2026 · Food". */
  periodLabel: string;
}

function FullList({
  transactions,
  categoryOptions,
}: Omit<PeriodTransactionsDialogProps, "periodLabel">) {
  const [visibleCount, setVisibleCount] = React.useState(PER_PAGE);
  const hiddenCount = transactions.length - visibleCount;

  return (
    <PeriodTransactionsList
      transactions={transactions.slice(0, visibleCount)}
      categoryOptions={categoryOptions}
      footer={
        hiddenCount > 0 && (
          <Button
            variant="surface"
            onClick={() => setVisibleCount((count) => count + PER_PAGE)}
          >
            Show more ({hiddenCount} left)
          </Button>
        )
      }
    />
  );
}

export default function PeriodTransactionsDialog({
  transactions,
  categoryOptions,
  periodLabel,
}: PeriodTransactionsDialogProps) {
  return (
    <Dialog.Root
      lazyMount
      unmountOnExit
      placement="center"
      scrollBehavior="inside"
      size={{ mdDown: "full", md: "xl" }}
    >
      <Dialog.Trigger asChild>
        <Button variant="surface" size="sm">
          See more
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop {...dialogBackdropMotion} />
        <Dialog.Positioner>
          <Dialog.Content {...dialogContentMotion}>
            <Dialog.Header flexDirection="column" alignItems="flex-start" gap={1}>
              <Dialog.Title>Transactions</Dialog.Title>
              <Text color="fg.muted" fontSize="sm">
                {periodLabel} · {transactions.length}{" "}
                {transactions.length === 1 ? "line" : "lines"}
              </Text>
            </Dialog.Header>
            <Dialog.Body>
              <FullList
                transactions={transactions}
                categoryOptions={categoryOptions}
              />
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
