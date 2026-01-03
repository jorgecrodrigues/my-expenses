"use client";

import React from "react";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import {
  Button,
  CloseButton,
  Dialog,
  Editable,
  FileUpload,
  FormatByte,
  HStack,
  Icon,
  IconButton,
  Popover,
  Portal,
  Table,
  Text,
  useFileUpload,
  useFileUploadContext,
  VStack,
} from "@chakra-ui/react";
import {
  IconArchiveFilled,
  IconDownload,
  IconFiles,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

type Expense = Doc<"expenses">;
type ExpenseFile = Doc<"expensesFiles">;
interface ManageExpenseFilesProps {
  expense: Expense;
}

export default function ManageExpenseFiles({
  expense,
  ...rest
}: ManageExpenseFilesProps) {
  const [open, setOpen] = React.useState<boolean>(false);

  const [loading, setLoading] = React.useState<boolean>(false);

  const generateUploadUrl = useMutation(api.expensesfiles.generateUploadUrl);
  const sendFile = useMutation(api.expensesfiles.sendFile);

  const files = useQuery(api.expensesfiles.getExpenseFiles, {
    expenseId: expense._id,
  });

  const fileUpload = useFileUpload({
    maxFiles: 10,
    maxFileSize: 10 * 1024 * 1024, // 10 MB
    accept: ["image/*", "application/pdf"],
  });

  const handleSendFiles = React.useCallback(
    async (e: React.FormEvent<HTMLButtonElement>) => {
      e.preventDefault();
      try {
        setLoading(true);
        // Step 1: Get a short-lived upload URL from the server
        const postUrl = await generateUploadUrl();
        // Step 2-4: Upload all files in parallel and wait for completion
        await Promise.all(
          fileUpload.acceptedFiles.map(async (file) => {
            // Step 2: POST the file to the upload URL obtained from the server
            const result = await fetch(postUrl, {
              method: "POST",
              headers: { "Content-Type": file.type },
              body: file,
            });
            if (!result.ok) {
              throw new Error(`Upload failed: ${result.statusText}`);
            }
            // Step 3: Save the newly allocated storage ID in the database
            const { storageId } = await result.json();
            // Step 4: Inform the server about the new file associated with the expense
            await sendFile({
              storageId,
              userId: expense.userId,
              expenseId: expense._id,
              contentType: file.type,
              filename: file.name,
              size: file.size,
            });
          })
        );
      } catch (error) {
        // Handle errors appropriately
        throw new Error("Failed to upload file.", { cause: error });
      } finally {
        // Step 5: Clear the file input and loading state
        setLoading(false);
        fileUpload.clearFiles();
      }
    },
    [expense, fileUpload, generateUploadUrl, sendFile]
  );

  return (
    <Dialog.Root
      lazyMount
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
        <Dialog.Backdrop bg="blackAlpha.800" />
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
                  <FileUploadList />
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
                        <HStack>
                          <DownloadFile file={file} />
                          <DeleteFile file={file} />
                        </HStack>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                  {files?.length === 0 && (
                    <Table.Row>
                      <Table.Cell colSpan={5}>
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

function FileUploadList() {
  const fileUpload = useFileUploadContext();

  const handleChangeFileName = React.useCallback(
    (file: File, newFileName: string) => {
      fileUpload.setFiles(
        fileUpload.acceptedFiles.map((f) =>
          f === file ? new File([f], newFileName, { type: f.type }) : f
        )
      );
    },
    [fileUpload]
  );

  if (fileUpload.acceptedFiles.length === 0) return null;

  return (
    <FileUpload.ItemGroup gap={1}>
      {fileUpload.acceptedFiles.map((file) => (
        <FileUpload.Item key={file.name} file={file} py={1}>
          <Editable.Root
            defaultValue={file.name}
            onValueCommit={({ value }) => handleChangeFileName(file, value)}
          >
            <Editable.Preview />
            <Editable.Input />
          </Editable.Root>
          <FileUpload.ItemSizeText whiteSpace="nowrap" />
          <FileUpload.ItemDeleteTrigger alignSelf="center" asChild>
            <IconButton
              aria-label="Remove File"
              title="Remove File"
              variant="plain"
              size="sm"
            >
              <IconTrash />
            </IconButton>
          </FileUpload.ItemDeleteTrigger>
        </FileUpload.Item>
      ))}
    </FileUpload.ItemGroup>
  );
}

interface DownloadFileProps {
  file: ExpenseFile;
}
function DownloadFile(props: DownloadFileProps) {
  const [loading, setLoading] = React.useState<boolean>(false);
  const url = useQuery(api.expensesfiles.getUrl, {
    storageId: props.file.storageId,
  });

  const handleDownload = React.useCallback(async () => {
    if (!url) return;

    let blobUrl: string | null = null;

    try {
      setLoading(true);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }

      const blob = await response.blob();
      blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = props.file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to download file:", error);
    } finally {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
      setLoading(false);
    }
  }, [url, props.file.filename]);

  return (
    <IconButton
      variant="plain"
      onClick={handleDownload}
      loading={loading}
      disabled={!url || loading}
    >
      <IconDownload />
    </IconButton>
  );
}

interface DeleteFileProps {
  file: ExpenseFile;
}
function DeleteFile(props: DeleteFileProps) {
  const [loading, setLoading] = React.useState<boolean>(false);
  const deleteFile = useMutation(api.expensesfiles.deleteExpenseFile);
  const handleDeleteFile = React.useCallback(
    async (fileId: Id<"expensesFiles">) => {
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
    <Popover.Root
      positioning={{
        placement: "top-end",
        offset: {
          crossAxis: 0,
          mainAxis: 0,
        },
      }}
    >
      <Popover.Trigger asChild>
        <IconButton
          aria-label="Delete File"
          title="Delete File"
          variant="plain"
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
          <Popover.Body px={4} py={4}>
            <VStack align="stretch">
              <Text>Are you sure you want to delete this file?</Text>
              <Button
                variant="surface"
                colorPalette="red"
                loading={loading}
                onClick={() => handleDeleteFile(props.file._id)}
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
