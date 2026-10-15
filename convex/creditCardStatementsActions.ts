"use node";

import { GoogleGenAI } from "@google/genai";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  buildExtractionPrompt,
  parseExtraction,
  STATEMENT_EXTRACTION_SCHEMA,
  type ExtractedStatement,
} from "./lib/creditCardExtraction";
import {
  buildStatementReport,
  buildSummaryPrompt,
} from "./lib/creditCardReport";
import {
  ENCRYPTED_STATEMENT_MESSAGE,
  INVALID_STATEMENT_MESSAGE,
  isEncryptedPdf,
  trimToPdfHeader,
} from "./lib/creditCardRules";
import type { CreditCardIssuer } from "./lib/creditCardValidators";

const GEMINI_MODEL = "gemini-3.8-flash";

function createClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured on the Convex deployment",
    );
  }
  return new GoogleGenAI({ apiKey });
}

async function extractStatement(
  ai: GoogleGenAI,
  issuer: CreditCardIssuer,
  pdf: Blob,
): Promise<ExtractedStatement> {
  const bytes = trimToPdfHeader(new Uint8Array(await pdf.arrayBuffer()));
  if (!bytes) {
    throw new Error(INVALID_STATEMENT_MESSAGE);
  }
  if (isEncryptedPdf(bytes)) {
    throw new Error(ENCRYPTED_STATEMENT_MESSAGE);
  }
  const data = Buffer.from(bytes).toString("base64");
  const interaction = await ai.interactions.create({
    model: GEMINI_MODEL,
    system_instruction: buildExtractionPrompt(issuer),
    input: [
      {
        type: "text",
        text: "Extract the statement header and every transaction line from this PDF.",
      },
      { type: "document", data, mime_type: "application/pdf" },
    ],
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: STATEMENT_EXTRACTION_SCHEMA,
    },
    store: false,
  });

  if (!interaction.output_text) {
    throw new Error("The AI returned an empty response");
  }
  let raw: unknown;
  try {
    raw = JSON.parse(interaction.output_text);
  } catch {
    throw new Error("The AI response is not valid JSON");
  }
  return parseExtraction(raw);
}

async function writeSummary(
  ai: GoogleGenAI,
  issuer: CreditCardIssuer,
  extraction: ExtractedStatement,
): Promise<string | undefined> {
  const report = buildStatementReport(extraction.transactions);
  const interaction = await ai.interactions.create({
    model: GEMINI_MODEL,
    input: buildSummaryPrompt(
      {
        issuer,
        referenceMonth: extraction.referenceMonth,
        totalAmountCents: extraction.totalAmountCents,
      },
      report,
    ),
    store: false,
  });
  return interaction.output_text?.trim() || undefined;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error";
}

/**
 * Extracts the lines of a statement PDF with Gemini, stores them and then
 * writes the AI summary. A summary failure keeps the extracted data.
 */
export const processStatement = internalAction({
  args: { statementId: v.id("creditCardStatements") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const started = await ctx.runMutation(
      internal.creditCardStatements.markProcessing,
      { statementId: args.statementId },
    );
    if (!started) {
      return null;
    }
    const statement = await ctx.runQuery(
      internal.creditCardStatements.getForProcessing,
      { statementId: args.statementId },
    );
    if (!statement) {
      return null;
    }

    let ai: GoogleGenAI;
    let extraction: ExtractedStatement;
    try {
      ai = createClient();
      const pdf = await ctx.storage.get(statement.storageId);
      if (!pdf) {
        throw new Error("The statement file is no longer available");
      }
      extraction = await extractStatement(ai, statement.issuer, pdf);
    } catch (error) {
      console.error("Statement extraction failed", {
        statementId: args.statementId,
        error: toErrorMessage(error),
      });
      await ctx.runMutation(internal.creditCardStatements.markFailed, {
        statementId: args.statementId,
        errorMessage: `Could not read the statement: ${toErrorMessage(error)}`,
      });
      return null;
    }

    const saved = await ctx.runMutation(
      internal.creditCardStatements.saveExtraction,
      { statementId: args.statementId, extraction },
    );
    if (!saved) {
      return null;
    }

    try {
      const aiSummary = await writeSummary(ai, statement.issuer, extraction);
      if (aiSummary) {
        await ctx.runMutation(internal.creditCardStatements.saveSummary, {
          statementId: args.statementId,
          aiSummary,
        });
      }
    } catch (error) {
      console.error("Statement summary failed", {
        statementId: args.statementId,
        error: toErrorMessage(error),
      });
    }
    return null;
  },
});
