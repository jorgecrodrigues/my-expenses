import React from "react";
import {
  Box,
  Button,
  Field,
  FileUpload,
  HStack,
  Icon,
  NativeSelect,
  Stack,
  Text,
  useFileUpload,
} from "@chakra-ui/react";
import { IconCloudUpload, IconFileTypePdf, IconSparkles } from "@tabler/icons-react";
import { toaster } from "@/components/ui/toaster";
import {
  CREDIT_CARD_ISSUERS,
  MAX_STATEMENT_FILE_SIZE,
  STATEMENT_CONTENT_TYPE,
} from "../../../../convex/lib/creditCardRules";
import type { CreditCardIssuer } from "../../../../convex/lib/creditCardValidators";
import useUploadStatement from "../hooks/useUploadStatement";

const MAX_SIZE_MB = MAX_STATEMENT_FILE_SIZE / (1024 * 1024);

function describeRejection(errors: readonly string[]): string {
  if (errors.includes("FILE_TOO_LARGE")) return `The file is larger than ${MAX_SIZE_MB} MB.`;
  if (errors.includes("FILE_INVALID_TYPE")) return "Only PDF statements are accepted.";
  return "This file cannot be uploaded.";
}

export default function StatementUploader() {
  const [issuer, setIssuer] = React.useState<CreditCardIssuer>("nubank");
  const { upload, uploading } = useUploadStatement();
  const fileUpload = useFileUpload({
    maxFiles: 1,
    maxFileSize: MAX_STATEMENT_FILE_SIZE,
    accept: [STATEMENT_CONTENT_TYPE],
    disabled: uploading,
  });
  const file = fileUpload.acceptedFiles[0];
  const rejection = fileUpload.rejectedFiles[0];

  const handleUpload = async () => {
    if (!file) return;
    try {
      await upload(file, issuer);
      fileUpload.clearFiles();
      toaster.create({
        type: "success",
        title: "Statement uploaded",
        description: "The AI is reading it. The report appears here when it is ready.",
      });
    } catch (error) {
      toaster.create({
        type: "error",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <Box
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="xl"
      bg="bg.panel"
      p={4}
    >
      <Stack gap={4}>
        <Field.Root maxW="xs">
          <Field.Label>Card issuer</Field.Label>
          <NativeSelect.Root disabled={uploading}>
            <NativeSelect.Field
              aria-label="Card issuer"
              value={issuer}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setIssuer(e.target.value as CreditCardIssuer)
              }
            >
              {CREDIT_CARD_ISSUERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>

        <FileUpload.RootProvider value={fileUpload} alignItems="stretch" gap={3}>
          <FileUpload.HiddenInput />
          <FileUpload.Dropzone w="full" minH="32" cursor="pointer">
            <Icon as={IconCloudUpload} boxSize={8} color="fg.muted" />
            <FileUpload.DropzoneContent>
              <Box>Drag and drop the statement PDF here, or click to browse</Box>
              <Box color="fg.muted">One PDF, up to {MAX_SIZE_MB} MB</Box>
            </FileUpload.DropzoneContent>
          </FileUpload.Dropzone>
        </FileUpload.RootProvider>

        {rejection && (
          <Text role="alert" fontSize="sm" color="fg.error">
            {describeRejection(rejection.errors)}
          </Text>
        )}

        {file && (
          <HStack justify="space-between" gap={3}>
            <HStack gap={2} minW={0}>
              <Icon as={IconFileTypePdf} boxSize={5} color="fg.muted" />
              <Text fontSize="sm" truncate>
                {file.name}
              </Text>
            </HStack>
            <HStack gap={2} flexShrink={0}>
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
                <IconSparkles />
                Analyze statement
              </Button>
            </HStack>
          </HStack>
        )}
      </Stack>
    </Box>
  );
}
