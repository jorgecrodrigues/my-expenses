"use client";

import React from "react";
import {
  Button,
  CloseButton,
  Dialog,
  Field,
  IconButton,
  Input,
  Portal,
  Separator,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";
import CategoryCombobox from "@/shared/components/CategoryCombobox";
import RecurrenceFields from "../components/RecurrenceFields";
import BRLCurrencyInput from "@/shared/components/BRLCurrencyInput";
import { toaster } from "@/components/ui/toaster";
import { parseBRL } from "@/shared/utils/currency";
import {
  dialogBackdropMotion,
  dialogContentMotion,
} from "@/shared/animation/chakraMotion";
import {
  addInterval,
  getSchedule,
  toDateInputValue,
  toDateTimeLocalValue,
  type RecurrenceValue,
} from "../utils/recurrence";
import { IconCopyPlusFilled } from "@tabler/icons-react";

type Expense = Doc<"expenses">;

interface DuplicateExpenseProps {
  expense: Expense;
}

const DEFAULT_COUNT = 12;

/** Starts one month after the original bill, repeating monthly for a year. */
function getInitialRecurrence(expense: Expense): RecurrenceValue {
  const start = addInterval(new Date(expense.date), "monthly", 1);
  return {
    start: toDateTimeLocalValue(start),
    frequency: "monthly",
    interval: "1",
    endMode: "count",
    count: String(DEFAULT_COUNT),
    until: toDateInputValue(addInterval(start, "monthly", DEFAULT_COUNT - 1)),
  };
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text
      fontSize="xs"
      fontWeight="semibold"
      color="fg.muted"
      textTransform="uppercase"
      letterSpacing="wide"
    >
      {children}
    </Text>
  );
}

export default function DuplicateExpenseDialog(props: DuplicateExpenseProps) {
  const { expense, ...rest } = props;

  const [open, setOpen] = React.useState<boolean>(false);
  const [recurrence, setRecurrence] = React.useState<RecurrenceValue>(() =>
    getInitialRecurrence(expense),
  );
  const [amount, setAmount] = React.useState<number>(expense.amount);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const expenseCategoryOptions = useQuery(
    api.expenses.getExpenseCategoryOptions,
  );
  const addRecurringExpenses = useMutation(api.expenses.addRecurringExpenses);

  const schedule = React.useMemo(() => getSchedule(recurrence), [recurrence]);
  const count = schedule.dates.length;

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setRecurrence(getInitialRecurrence(expense));
      setAmount(expense.amount);
    }
    setOpen(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLElement>) => {
    event.preventDefault();
    if (count === 0) return;

    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const description = String(formData.get("description") ?? "").trim();

    setIsSubmitting(true);
    try {
      await addRecurringExpenses({
        name: String(formData.get("name") ?? ""),
        description: description || undefined,
        amount: parseBRL(String(formData.get("amount") ?? "")),
        category: String(formData.get("category") ?? ""),
        dates: schedule.dates.map((date) => date.toISOString()),
      });
      setOpen(false);
      toaster.create({
        type: "success",
        title: `${count} ${count === 1 ? "bill" : "bills"} created.`,
        duration: 2000,
      });
    } catch (error) {
      console.error(error);
      toaster.create({
        type: "error",
        title: "Failed to duplicate expense.",
        description: error instanceof Error ? error.message : undefined,
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root
      lazyMount
      open={open}
      placement="center"
      closeOnInteractOutside={false}
      size={{ mdDown: "full", md: "lg" }}
      onOpenChange={(e) => handleOpenChange(e.open)}
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
        <Dialog.Backdrop {...dialogBackdropMotion} />
        <Dialog.Positioner>
          <Dialog.Content
            as="form"
            onSubmit={handleSubmit}
            {...dialogContentMotion}
          >
            <Dialog.Header flexDirection="column" alignItems="flex-start">
              <Dialog.Title>Duplicate Expense</Dialog.Title>
              <Dialog.Description fontSize="sm" color="fg.muted">
                Create copies of this bill on a schedule. New bills start
                unpaid.
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap={5}>
                <Stack gap={3}>
                  <SectionTitle>Bill details</SectionTitle>
                  <Field.Root required>
                    <Field.Label>
                      Name
                      <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                      type="text"
                      name="name"
                      placeholder="Enter name"
                      defaultValue={expense.name}
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Description</Field.Label>
                    <Input
                      type="text"
                      name="description"
                      placeholder="Enter description (optional)"
                      defaultValue={expense.description}
                    />
                  </Field.Root>
                  <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
                    <Field.Root required>
                      <Field.Label>
                        Amount (BRL)
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <BRLCurrencyInput
                        type="text"
                        name="amount"
                        placeholder="Enter amount"
                        defaultValue={expense.amount}
                        onValueChange={setAmount}
                      />
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
                  </SimpleGrid>
                </Stack>

                <Separator />

                <Stack gap={3}>
                  <SectionTitle>Schedule</SectionTitle>
                  <RecurrenceFields
                    value={recurrence}
                    onChange={setRecurrence}
                    schedule={schedule}
                    amount={amount}
                    originalDate={new Date(expense.date)}
                  />
                </Stack>
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">Cancel</Button>
              </Dialog.ActionTrigger>
              <Button
                type="submit"
                variant="solid"
                loading={isSubmitting}
                disabled={count === 0}
              >
                {count === 1 ? "Create 1 bill" : `Create ${count} bills`}
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
