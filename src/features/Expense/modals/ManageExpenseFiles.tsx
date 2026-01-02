"use client";

import React from "react";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import {
  Button,
  CloseButton,
  Dialog,
  FileUpload,
  FormatByte,
  Icon,
  IconButton,
  Popover,
  Portal,
  Table,
  Text,
  useFileUpload,
  VStack,
} from "@chakra-ui/react";
import {
  IconArchiveFilled,
  IconFiles,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

type Expense = Doc<"expenses">;
interface ManageExpenseFilesProps {
  expense: Expense;
}

export default function ManageExpenseFiles({
  expense,
  ...rest
}: ManageExpenseFilesProps) {
  const [open, setOpen] = React.useState<boolean>(false);

  const [loading, setLoading] = React.useState<boolean>(false);

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const sendFile = useMutation(api.files.sendFile);

  const files = useQuery(api.files.getFiles, { expenseId: expense._id });

  const fileUpload = useFileUpload({
    maxFiles: 1,
    maxFileSize: 10 * 1024 * 1024, // 10 MB
    accept: ["image/*", "application/pdf"],
  });

  const handleSendFiles = React.useCallback(
    async (e: React.FormEvent<HTMLButtonElement>) => {
      e.preventDefault();

      setLoading(true);

      // Step 1: Get a short-lived upload URL from the server
      const postUrl = await generateUploadUrl();

      // Step 2: POST the file to the upload URL obtained from the server
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": fileUpload.acceptedFiles[0].type },
        body: fileUpload.acceptedFiles[0],
      });

      // Step 3: Save the newly allocated storage ID in the database
      const { storageId } = await result.json();

      await sendFile({
        storageId,
        userId: expense.userId,
        expenseId: expense._id,
        contentType: fileUpload.acceptedFiles[0].type,
        filename: fileUpload.acceptedFiles[0].name,
        size: fileUpload.acceptedFiles[0].size,
      });

      setLoading(false);
      fileUpload.clearFiles();
    },
    [expense, fileUpload, generateUploadUrl, sendFile]
  );

  return (
    <Dialog.Root
      lazyMount
      open={open}
      placement="center"
      closeOnInteractOutside={false}
      size={{ mdDown: "full", md: "xl" }}
      onOpenChange={(e) => setOpen(e.open)}
      {...rest}
    >
      <Dialog.Trigger asChild>
        <IconButton
          aria-label="Manage Expense Files"
          title="Manage Expense Files"
          variant="ghost"
        >
          <IconArchiveFilled />
        </IconButton>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title alignItems="center" display="flex" gap={2}>
                <Icon as={IconArchiveFilled} boxSize={8} />
                <Text>Manage Expense Files</Text>
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body display="flex" flexDirection="column" gap={4}>
              <Text>
                <b>{expense.name}</b>,{" "}
                {new Date(expense.date).toLocaleDateString("pt-PT", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                .
              </Text>
              <VStack justify="flex-start" align="flex-start" gap={4}>
                <FileUpload.RootProvider value={fileUpload}>
                  <FileUpload.HiddenInput />
                  <FileUpload.Trigger asChild>
                    <Button variant="outline">
                      <IconFiles /> Select Files to Upload
                    </Button>
                  </FileUpload.Trigger>
                  <FileUpload.List />
                </FileUpload.RootProvider>
                <Button
                  variant="solid"
                  colorScheme="blue"
                  disabled={fileUpload.acceptedFiles.length === 0}
                  loading={loading}
                  display={
                    fileUpload.acceptedFiles.length === 0 ? "none" : "flex"
                  }
                  onClick={handleSendFiles}
                >
                  <IconUpload />
                  Upload Files
                </Button>
              </VStack>

              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Filename</Table.ColumnHeader>
                    <Table.ColumnHeader>Content Type</Table.ColumnHeader>
                    <Table.ColumnHeader>Size</Table.ColumnHeader>
                    <Table.ColumnHeader>Created At</Table.ColumnHeader>
                    <Table.ColumnHeader w="1%">Actions</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {files?.map?.((file) => (
                    <Table.Row key={file._id}>
                      <Table.Cell fontSize="xs">{file.filename}</Table.Cell>
                      <Table.Cell fontSize="xs" color="gray.500">
                        {file.contentType}
                      </Table.Cell>
                      <Table.Cell fontSize="xs" color="gray.100">
                        <FormatByte value={file.size} />
                      </Table.Cell>
                      <Table.Cell fontSize="xs" color="gray.500">
                        {new Date(file._creationTime).toLocaleString("pt-BR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </Table.Cell>
                      <Table.Cell fontSize="xs" color="gray.500">
                        <DeleteFile fileId={file._id} />
                      </Table.Cell>
                    </Table.Row>
                  ))}
                  {files?.length === 0 && (
                    <Table.Row>
                      <Table.Cell colSpan={5} textAlign="center">
                        No files uploaded for this expense.
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table.Root>
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

function DeleteFile(props: { fileId: Id<"files"> }) {
  const [loading, setLoading] = React.useState<boolean>(false);
  const deleteFile = useMutation(api.files.deleteFile);
  const handleDeleteFile = React.useCallback(
    async (fileId: Id<"files">) => {
      try {
        setLoading(true);
        await deleteFile({ fileId });
      } catch (error) {
        throw new Error("Failed to delete file.", { cause: error });
      } finally {
        setLoading(false);
      }
    },
    [deleteFile]
  );
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <IconButton
          aria-label="Delete File"
          title="Delete File"
          variant="ghost"
          colorPalette="red"
        >
          <IconTrash />
        </IconButton>
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content>
          <Popover.CloseTrigger />
          <Popover.Arrow>
            <Popover.ArrowTip />
          </Popover.Arrow>
          <Popover.Body>
            <VStack align="stretch">
              <Text>Are you sure you want to delete this file?</Text>
              <Button
                variant="surface"
                colorPalette="red"
                loading={loading}
                onClick={() => handleDeleteFile(props.fileId)}
              >
                <IconTrash />
                Delete File
              </Button>
            </VStack>
          </Popover.Body>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
}
