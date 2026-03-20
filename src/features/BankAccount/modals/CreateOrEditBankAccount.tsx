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
  NativeSelect,
  Portal,
} from "@chakra-ui/react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";
import BRLCurrencyInput from "@/shared/components/BRLCurrencyInput";
import { toaster } from "@/components/ui/toaster";
import {
  dialogBackdropMotion,
  dialogContentMotion,
} from "@/shared/animation/chakraMotion";
import { IconEdit, IconPlus } from "@tabler/icons-react";

type BankAccount = Doc<"bankAccounts">;

type AccountType = "checking" | "savings" | "credit" | "debit";

interface CreateOrEditBankAccountProps {
  account?: BankAccount;
}

export default function CreateOrEditBankAccountDialog(
  props: CreateOrEditBankAccountProps
) {
  const { account, ...rest } = props;

  const [open, setOpen] = React.useState<boolean>(false);

  const addBankAccount = useMutation(api.bankAccounts.addBankAccount);
  const updateBankAccount = useMutation(api.bankAccounts.updateBankAccount);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const formData = new FormData(event.target as HTMLFormElement);
    const formValues = Object.fromEntries(formData.entries());

    const sanitizedAmount = formValues.accountAmount
      ?.toString()
      .replace(/[^\d.,]/g, "")
      .trim()
      .replace(".", "")
      .replace(",", ".");

    const payload = {
      accountName: formValues.accountName?.toString() || undefined,
      accountNumber: formValues.accountNumber?.toString() || undefined,
      accountAgency: formValues.accountAgency?.toString() || undefined,
      accountDigit: formValues.accountDigit?.toString() || undefined,
      accountType: (formValues.accountType?.toString() || undefined) as
        | AccountType
        | undefined,
      accountAmount: sanitizedAmount ? Number(sanitizedAmount) : undefined,
    };

    if (account) {
      updateBankAccount({ id: account._id, ...payload })
        .then(() => {
          setOpen(false);
          toaster.create({
            type: "success",
            title: "Account updated successfully!",
            duration: 2000,
          });
        })
        .catch((error) => {
          console.error(error);
          toaster.create({
            type: "error",
            title: "Failed to update account.",
            description: error.message,
            duration: 4000,
          });
        });
    } else {
      addBankAccount(payload)
        .then(() => {
          setOpen(false);
          toaster.create({
            type: "success",
            title: "Account added successfully!",
            duration: 2000,
          });
        })
        .catch((error) => {
          console.error(error);
          toaster.create({
            type: "error",
            title: "Failed to add account.",
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
        {account ? (
          <IconButton
            aria-label="Edit Bank Account"
            title="Edit Bank Account"
            variant="ghost"
          >
            <IconEdit />
          </IconButton>
        ) : (
          <Button variant="surface" colorPalette="green" size="sm">
            Add Account <IconPlus />
          </Button>
        )}
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop {...dialogBackdropMotion} />
        <Dialog.Positioner>
          <Dialog.Content
            as="form"
            onSubmit={handleSubmit}
            {...dialogContentMotion}
          >
            <Dialog.Header>
              <Dialog.Title>
                {account ? "Edit Account" : "Add New Account"}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body display="flex" flexDirection="column" gap={4}>
              <HStack>
                <Field.Root>
                  <Field.Label>Account Name</Field.Label>
                  <Input
                    type="text"
                    name="accountName"
                    placeholder="Enter account name"
                    defaultValue={account?.accountName}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Account Type</Field.Label>
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      name="accountType"
                      defaultValue={account?.accountType ?? ""}
                    >
                      <option value="">Select type</option>
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                      <option value="credit">Credit</option>
                      <option value="debit">Debit</option>
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Field.Root>
              </HStack>

              <HStack>
                <Field.Root>
                  <Field.Label>Account Number</Field.Label>
                  <Input
                    type="text"
                    name="accountNumber"
                    placeholder="Enter account number"
                    defaultValue={account?.accountNumber}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Balance (BRL)</Field.Label>
                  <BRLCurrencyInput
                    name="accountAmount"
                    placeholder="Enter balance"
                    defaultValue={account?.accountAmount}
                  />
                </Field.Root>
              </HStack>

              <HStack>
                <Field.Root>
                  <Field.Label>Agency</Field.Label>
                  <Input
                    type="text"
                    name="accountAgency"
                    placeholder="Enter agency"
                    defaultValue={account?.accountAgency}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Digit</Field.Label>
                  <Input
                    type="text"
                    name="accountDigit"
                    placeholder="Enter digit"
                    defaultValue={account?.accountDigit}
                    maxLength={1}
                  />
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
                colorPalette={account ? "blue" : "green"}
              >
                {account ? "Save Changes" : "Add Account"}
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
