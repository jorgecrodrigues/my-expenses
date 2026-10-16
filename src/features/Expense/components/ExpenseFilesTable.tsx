import React from "react";
import {
  Button,
  FormatByte,
  HStack,
  Icon,
  IconButton,
  Popover,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { IconDownload, IconTrash } from "@tabler/icons-react";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../../../convex/_generated/api";
import { toaster } from "@/components/ui/toaster";
import { popoverContentMotion } from "@/shared/animation/chakraMotion";
import {
  formatFileUploadedAt,
  getExpenseFileIcon,
} from "../utils/expenseFiles";

export type ExpenseFileWithUrl = FunctionReturnType<
  typeof api.expensesfiles.getExpenseFiles
>[number];

interface ExpenseFilesTableProps {
  /** `undefined` while loading. */
  files: ExpenseFileWithUrl[] | undefined;
}

export default function ExpenseFilesTable({ files }: ExpenseFilesTableProps) {
  return (
    <Table.ScrollArea>
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>File</Table.ColumnHeader>
            <Table.ColumnHeader>Uploaded</Table.ColumnHeader>
            <Table.ColumnHeader w="1%" textAlign="end">
              Actions
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {files === undefined && (
            <Table.Row>
              <Table.Cell colSpan={3}>
                <HStack justify="center" py={4} color="fg.muted">
                  <Spinner size="sm" />
                  <Text>Loading files...</Text>
                </HStack>
              </Table.Cell>
            </Table.Row>
          )}
          {files?.length === 0 && (
            <Table.Row>
              <Table.Cell colSpan={3}>
                <Text textAlign="center" py={4} color="fg.muted">
                  No files uploaded for this expense.
                </Text>
              </Table.Cell>
            </Table.Row>
          )}
          {files?.map((file) => (
            <Table.Row key={file._id}>
              <Table.Cell>
                <HStack gap={3}>
                  <Icon
                    as={getExpenseFileIcon(file.contentType)}
                    boxSize={5}
                    color="fg.muted"
                    flexShrink={0}
                  />
                  <Stack gap={0} minW={0}>
                    <Text truncate title={file.filename}>
                      {file.filename}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {file.contentType} · <FormatByte value={file.size} />
                    </Text>
                  </Stack>
                </HStack>
              </Table.Cell>
              <Table.Cell color="fg.muted" whiteSpace="nowrap">
                {formatFileUploadedAt(file._creationTime)}
              </Table.Cell>
              <Table.Cell>
                <HStack gap={1} justify="flex-end">
                  <DownloadFileButton file={file} />
                  <DeleteFileButton file={file} />
                </HStack>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}

interface FileActionProps {
  file: ExpenseFileWithUrl;
}

function DownloadFileButton({ file }: FileActionProps) {
  const [loading, setLoading] = React.useState(false);

  const handleDownload = async () => {
    if (!file.url) return;

    let blobUrl: string | null = null;
    setLoading(true);
    try {
      // Cross-origin URLs ignore the `download` attribute, so fetch the file
      // and download it from a blob to keep the original filename.
      const response = await fetch(file.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      blobUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to download file:", error);
      toaster.create({
        type: "error",
        title: "Download failed",
        description: `Could not download "${file.filename}". Please try again.`,
      });
    } finally {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      setLoading(false);
    }
  };

  return (
    <IconButton
      aria-label={`Download ${file.filename}`}
      title="Download file"
      variant="ghost"
      size="sm"
      loading={loading}
      disabled={!file.url}
      onClick={handleDownload}
    >
      <IconDownload />
    </IconButton>
  );
}

function DeleteFileButton({ file }: FileActionProps) {
  const [loading, setLoading] = React.useState(false);
  const deleteFile = useMutation(api.expensesfiles.deleteExpenseFile);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteFile({ fileId: file._id });
    } catch (error) {
      console.error("Failed to delete file:", error);
      toaster.create({
        type: "error",
        title: "Delete failed",
        description: `Could not delete "${file.filename}". Please try again.`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover.Root positioning={{ placement: "top-end" }}>
      <Popover.Trigger asChild>
        <IconButton
          aria-label={`Delete ${file.filename}`}
          title="Delete file"
          variant="ghost"
          size="sm"
          colorPalette="red"
        >
          <IconTrash />
        </IconButton>
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content {...popoverContentMotion}>
          <Popover.Arrow>
            <Popover.ArrowTip />
          </Popover.Arrow>
          <Popover.Body p={4}>
            <Stack gap={3}>
              <Text fontSize="sm">
                Delete <b>{file.filename}</b>? This cannot be undone.
              </Text>
              <Button
                variant="surface"
                colorPalette="red"
                size="sm"
                loading={loading}
                onClick={handleDelete}
              >
                <IconTrash />
                Delete file
              </Button>
            </Stack>
          </Popover.Body>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
}
