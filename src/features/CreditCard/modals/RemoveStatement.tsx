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
import { toaster } from "@/components/ui/toaster";
import { formatReferenceMonth, issuerLabel } from "../utils/creditCard";

interface RemoveStatementProps {
  statement: Doc<"creditCardStatements">;
  onRemoved?: () => void;
}

export default function RemoveStatementDialog({
  statement,
  onRemoved,
}: RemoveStatementProps) {
  const deleteStatement = useMutation(api.creditCardStatements.deleteStatement);

  const handleDelete = async () => {
    try {
      await deleteStatement({ statementId: statement._id });
      onRemoved?.();
    } catch (error) {
      toaster.create({
        type: "error",
        title: "Could not delete the statement",
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const name = statement.referenceMonth
    ? `${issuerLabel(statement.issuer)} ${formatReferenceMonth(statement.referenceMonth)}`
    : statement.filename;

  return (
    <Dialog.Root
      lazyMount
      placement="center"
      closeOnInteractOutside={false}
      size={{ mdDown: "full", md: "md" }}
    >
      <Dialog.Trigger asChild>
        <IconButton
          aria-label="Delete statement"
          title="Delete statement"
          variant="ghost"
          size="sm"
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
              Are you sure you want to delete the statement <b>"{name}"</b>? Its
              transactions and the PDF file are deleted too.
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
