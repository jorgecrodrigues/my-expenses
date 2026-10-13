import {
  Box,
  Button,
  Editable,
  FileUpload,
  HStack,
  Icon,
  IconButton,
  Stack,
  Text,
  useFileUpload,
} from "@chakra-ui/react";
import { IconCloudUpload, IconUpload, IconX } from "@tabler/icons-react";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  ACCEPTED_EXPENSE_FILE_TYPES,
  MAX_EXPENSE_FILE_SIZE,
  MAX_EXPENSE_FILES_PER_UPLOAD,
} from "../../../../convex/lib/expenseFileRules";
import { toaster } from "@/components/ui/toaster";
import useUploadExpenseFiles from "../hooks/useUploadExpenseFiles";
import {
  describeFileRejection,
  getExpenseFileIcon,
  getSelectedFileKey,
  renameKeepingExtension,
} from "../utils/expenseFiles";

const pluralizeFiles = (count: number) =>
  `${count} ${count === 1 ? "file" : "files"}`;

interface ExpenseFileUploaderProps {
  expenseId: Id<"expenses">;
}

export default function ExpenseFileUploader({
  expenseId,
}: ExpenseFileUploaderProps) {
  const { upload, uploading } = useUploadExpenseFiles(expenseId);
  const fileUpload = useFileUpload({
    maxFiles: MAX_EXPENSE_FILES_PER_UPLOAD,
    maxFileSize: MAX_EXPENSE_FILE_SIZE,
    accept: ACCEPTED_EXPENSE_FILE_TYPES,
    disabled: uploading,
  });
  const { acceptedFiles, rejectedFiles } = fileUpload;

  const handleRename = (file: File, nextName: string) => {
    const name = renameKeepingExtension(file.name, nextName);
    if (name === file.name) return;
    fileUpload.setFiles(
      acceptedFiles.map((f) =>
        f === file
          ? new File([f], name, { type: f.type, lastModified: f.lastModified })
          : f,
      ),
    );
  };

  const handleUpload = async () => {
    const { uploaded, failed } = await upload(acceptedFiles);
    fileUpload.clearRejectedFiles();

    if (failed.length === 0) {
      fileUpload.clearFiles();
      toaster.create({
        type: "success",
        title: `${pluralizeFiles(uploaded.length)} uploaded`,
      });
      return;
    }

    fileUpload.setFiles(failed);
    toaster.create({
      type: "error",
      title: "Upload failed",
      description: `${pluralizeFiles(failed.length)} could not be uploaded. They are still selected so you can try again.`,
    });
  };

  return (
    <FileUpload.RootProvider value={fileUpload} alignItems="stretch" gap={3}>
      <FileUpload.HiddenInput />
      <FileUpload.Dropzone w="full" minH="32" cursor="pointer">
        <Icon as={IconCloudUpload} boxSize={8} color="fg.muted" />
        <FileUpload.DropzoneContent>
          <Box>Drag and drop files here, or click to browse</Box>
          <Box color="fg.muted">
            Images or PDFs, up to {MAX_EXPENSE_FILE_SIZE / (1024 * 1024)} MB
            each ({MAX_EXPENSE_FILES_PER_UPLOAD} files max)
          </Box>
        </FileUpload.DropzoneContent>
      </FileUpload.Dropzone>

      {rejectedFiles.length > 0 && (
        <Stack gap={0} role="alert">
          {rejectedFiles.map((rejection) => (
            <Text
              key={getSelectedFileKey(rejection.file)}
              fontSize="sm"
              color="fg.error"
            >
              {describeFileRejection(rejection)}
            </Text>
          ))}
        </Stack>
      )}

      {acceptedFiles.length > 0 && (
        <>
          <FileUpload.ItemGroup gap={1}>
            {acceptedFiles.map((file) => (
              <FileUpload.Item
                key={getSelectedFileKey(file)}
                file={file}
                py={1}
                alignItems="center"
              >
                <Icon
                  as={getExpenseFileIcon(file.type)}
                  boxSize={5}
                  color="fg.muted"
                />
                <Editable.Root
                  size="sm"
                  flex="1"
                  minW={0}
                  defaultValue={file.name}
                  disabled={uploading}
                  onValueCommit={({ value }) => handleRename(file, value)}
                >
                  <Editable.Preview title="Click to rename" truncate />
                  <Editable.Input aria-label={`Rename ${file.name}`} />
                </Editable.Root>
                <FileUpload.ItemSizeText
                  whiteSpace="nowrap"
                  color="fg.muted"
                  fontSize="xs"
                />
                <FileUpload.ItemDeleteTrigger asChild>
                  <IconButton
                    aria-label={`Remove ${file.name}`}
                    title="Remove file"
                    variant="ghost"
                    size="xs"
                    disabled={uploading}
                  >
                    <IconX />
                  </IconButton>
                </FileUpload.ItemDeleteTrigger>
              </FileUpload.Item>
            ))}
          </FileUpload.ItemGroup>

          <HStack justify="flex-end" gap={2}>
            <Button
              variant="ghost"
              size="sm"
              disabled={uploading}
              onClick={() => fileUpload.clearFiles()}
            >
              Clear
            </Button>
            <Button
              colorPalette="blue"
              size="sm"
              loading={uploading}
              loadingText="Uploading..."
              onClick={handleUpload}
            >
              <IconUpload />
              Upload {pluralizeFiles(acceptedFiles.length)}
            </Button>
          </HStack>
        </>
      )}
    </FileUpload.RootProvider>
  );
}
