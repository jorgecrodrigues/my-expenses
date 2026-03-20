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
import {
  dialogBackdropMotion,
  dialogContentMotion,
} from "@/shared/animation/chakraMotion";

type BankAccount = Doc<"bankAccounts">;

interface RemoveBankAccountProps {
  account: BankAccount;
}

export default function RemoveBankAccountDialog(
  props: RemoveBankAccountProps
) {
  const { account, ...rest } = props;

  const deleteBankAccount = useMutation(api.bankAccounts.deleteBankAccount);

  const handleDelete = () => {
    deleteBankAccount({ id: account._id });
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
          aria-label="Delete Bank Account"
          title="Delete Bank Account"
          variant="ghost"
          colorPalette="red"
        >
          <IconTrash />
        </IconButton>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop {...dialogBackdropMotion} />
        <Dialog.Positioner>
          <Dialog.Content {...dialogContentMotion}>
            <Dialog.Header>
              <Dialog.Title>Confirm Deletion</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              Are you sure you want to delete the account{" "}
              <b>"{account.accountName ?? account.accountNumber ?? "this account"}"</b>?
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
