import React from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export interface UploadExpenseFilesResult {
  uploaded: File[];
  failed: File[];
}

/**
 * Uploads files to Convex storage and attaches them to an expense. Each file
 * gets its own upload URL (they are single-use), and one failing file does not
 * abort the others.
 */
export default function useUploadExpenseFiles(expenseId: Id<"expenses">) {
  const generateUploadUrl = useMutation(api.expensesfiles.generateUploadUrl);
  const sendFile = useMutation(api.expensesfiles.sendFile);
  const [uploading, setUploading] = React.useState(false);

  const uploadFile = React.useCallback(
    async (file: File) => {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) {
        throw new Error(`Upload of "${file.name}" failed (${response.status})`);
      }
      const { storageId } = (await response.json()) as {
        storageId: Id<"_storage">;
      };
      await sendFile({ expenseId, storageId, filename: file.name });
    },
    [expenseId, generateUploadUrl, sendFile],
  );

  const upload = React.useCallback(
    async (files: File[]): Promise<UploadExpenseFilesResult> => {
      setUploading(true);
      try {
        const results = await Promise.allSettled(files.map(uploadFile));
        const result: UploadExpenseFilesResult = { uploaded: [], failed: [] };
        results.forEach((outcome, index) => {
          if (outcome.status === "fulfilled") {
            result.uploaded.push(files[index]);
          } else {
            result.failed.push(files[index]);
            console.error(outcome.reason);
          }
        });
        return result;
      } finally {
        setUploading(false);
      }
    },
    [uploadFile],
  );

  return { upload, uploading };
}
