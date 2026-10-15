import React from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import type { CreditCardIssuer } from "../../../../convex/lib/creditCardValidators";

/**
 * Uploads a statement PDF to Convex storage and registers it, which schedules
 * the AI extraction on the backend.
 */
export default function useUploadStatement() {
  const generateUploadUrl = useMutation(
    api.creditCardStatements.generateUploadUrl,
  );
  const createStatement = useMutation(api.creditCardStatements.createStatement);
  const [uploading, setUploading] = React.useState(false);

  const upload = React.useCallback(
    async (
      file: File,
      issuer: CreditCardIssuer,
    ): Promise<Id<"creditCardStatements">> => {
      setUploading(true);
      try {
        const uploadUrl = await generateUploadUrl();
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!response.ok) {
          throw new Error(
            `Upload of "${file.name}" failed (${response.status})`,
          );
        }
        const { storageId } = (await response.json()) as {
          storageId: Id<"_storage">;
        };
        return await createStatement({
          storageId,
          filename: file.name,
          issuer,
        });
      } finally {
        setUploading(false);
      }
    },
    [generateUploadUrl, createStatement],
  );

  return { upload, uploading };
}
