import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { requireUserId } from "./lib/auth";
import {
  creditCardIssuerValidator,
  creditCardStatementExtractedFields,
  creditCardStatementValidator,
  creditCardTransactionExtractedFields,
  creditCardTransactionValidator,
  statementReportValidator,
  yearReportValidator,
} from "./lib/creditCardValidators";
import {
  isStatementContentType,
  MAX_STATEMENT_FILE_SIZE,
  resolveCategoryName,
} from "./lib/creditCardRules";
import { sumStatementCents } from "./lib/creditCardExtraction";
import {
  buildStatementReport,
  buildYearReport,
  referenceMonthRange,
  referenceMonthYears,
  type YearStatement,
} from "./lib/creditCardReport";

async function getOwnedStatement(
  ctx: QueryCtx,
  userId: Id<"users">,
  statementId: Id<"creditCardStatements">,
): Promise<Doc<"creditCardStatements"> | null> {
  const statement = await ctx.db.get("creditCardStatements", statementId);
  return statement && statement.userId === userId ? statement : null;
}

async function requireOwnedStatement(
  ctx: QueryCtx,
  userId: Id<"users">,
  statementId: Id<"creditCardStatements">,
): Promise<Doc<"creditCardStatements">> {
  const statement = await getOwnedStatement(ctx, userId, statementId);
  if (!statement) {
    throw new Error("Statement not found");
  }
  return statement;
}

async function getStatementTransactions(
  ctx: QueryCtx,
  statementId: Id<"creditCardStatements">,
): Promise<Doc<"creditCardTransactions">[]> {
  return await ctx.db
    .query("creditCardTransactions")
    .withIndex("by_statementId_and_date", (q) =>
      q.eq("statementId", statementId),
    )
    .collect();
}

async function deleteStatementTransactions(
  ctx: MutationCtx,
  statementId: Id<"creditCardStatements">,
): Promise<void> {
  const transactions = await getStatementTransactions(ctx, statementId);
  for (const transaction of transactions) {
    await ctx.db.delete("creditCardTransactions", transaction._id);
  }
}

async function scheduleProcessing(
  ctx: MutationCtx,
  statementId: Id<"creditCardStatements">,
): Promise<void> {
  await ctx.scheduler.runAfter(
    0,
    internal.creditCardStatementsActions.processStatement,
    { statementId },
  );
}

/**
 * Generates a single-use URL to upload one statement PDF to storage.
 */
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireUserId(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Registers an uploaded statement PDF and schedules its AI extraction.
 * Content type and size are read from the stored file, not trusted from the
 * client.
 *
 * @param storageId - The ID returned by the upload URL.
 * @param filename - The name shown to the user.
 * @param issuer - The card issuer, used to tune the extraction prompt.
 * @returns The ID of the new statement.
 */
export const createStatement = mutation({
  args: {
    storageId: v.id("_storage"),
    filename: v.string(),
    issuer: creditCardIssuerValidator,
  },
  returns: v.id("creditCardStatements"),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    const filename = args.filename.trim();
    if (!filename) {
      throw new Error("File name is required");
    }

    const metadata = await ctx.db.system.get("_storage", args.storageId);
    if (!metadata) {
      throw new Error("Uploaded file not found");
    }
    if (!isStatementContentType(metadata.contentType ?? "")) {
      await ctx.storage.delete(args.storageId);
      throw new Error("Invalid file type. Only PDF statements are allowed");
    }
    if (metadata.size > MAX_STATEMENT_FILE_SIZE) {
      await ctx.storage.delete(args.storageId);
      throw new Error("File is too large (max 15 MB)");
    }

    const statementId = await ctx.db.insert("creditCardStatements", {
      userId,
      issuer: args.issuer,
      storageId: args.storageId,
      filename,
      status: "pending",
    });
    await scheduleProcessing(ctx, statementId);
    return statementId;
  },
});

/**
 * Lists the caller's statements, newest first.
 */
export const listStatements = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(creditCardStatementValidator),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return await ctx.db
      .query("creditCardStatements")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

/**
 * Returns one of the caller's statements with its aggregated report. The
 * report is null until the extraction completes.
 *
 * @param statementId - The ID of the statement, as found in the page URL.
 * @returns null when the ID is malformed, or the statement does not exist or
 * belongs to someone else.
 */
export const getStatementReport = query({
  args: { statementId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      statement: creditCardStatementValidator,
      report: v.union(statementReportValidator, v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const statementId = ctx.db.normalizeId(
      "creditCardStatements",
      args.statementId,
    );
    if (!statementId) {
      return null;
    }
    const statement = await getOwnedStatement(ctx, userId, statementId);
    if (!statement) {
      return null;
    }
    if (statement.status !== "completed") {
      return { statement, report: null };
    }
    const transactions = await getStatementTransactions(ctx, statement._id);
    return { statement, report: buildStatementReport(transactions) };
  },
});

async function getYearStatements(
  ctx: QueryCtx,
  userId: Id<"users">,
  year: number,
): Promise<YearStatement[]> {
  const { start, end } = referenceMonthRange(year);
  const statements = await ctx.db
    .query("creditCardStatements")
    .withIndex("by_userId_and_referenceMonth", (q) =>
      q
        .eq("userId", userId)
        .gte("referenceMonth", start)
        .lte("referenceMonth", end),
    )
    .collect();
  return await Promise.all(
    statements
      .filter((statement) => statement.status === "completed")
      .map(async (statement) => ({
        issuer: statement.issuer,
        referenceMonth: statement.referenceMonth ?? start,
        transactions: await getStatementTransactions(ctx, statement._id),
      })),
  );
}

/**
 * Lists the years that have at least one processed statement, newest first.
 */
export const listStatementYears = query({
  args: {},
  returns: v.array(v.number()),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const statements = await ctx.db
      .query("creditCardStatements")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return referenceMonthYears(
      statements
        .filter((statement) => statement.status === "completed")
        .map((statement) => statement.referenceMonth),
    );
  },
});

/**
 * Aggregates the caller's processed statements of one year, by the month
 * each statement refers to.
 *
 * @param year - The calendar year, e.g. 2026.
 */
export const getYearReport = query({
  args: { year: v.number() },
  returns: yearReportValidator,
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const statements = await getYearStatements(ctx, userId, args.year);
    return buildYearReport(args.year, statements);
  },
});

/**
 * Lists the lines of one of the caller's statements, ordered by date.
 *
 * @param statementId - The ID of the statement.
 * @param category - When set, only lines of this category.
 */
export const listTransactions = query({
  args: {
    statementId: v.id("creditCardStatements"),
    category: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(creditCardTransactionValidator),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await requireOwnedStatement(ctx, userId, args.statementId);
    const { category } = args;
    const transactions = ctx.db.query("creditCardTransactions");
    const query =
      category === undefined
        ? transactions.withIndex("by_statementId_and_date", (q) =>
            q.eq("statementId", args.statementId),
          )
        : transactions.withIndex("by_statementId_and_category_and_date", (q) =>
            q.eq("statementId", args.statementId).eq("category", category),
          );
    return await query.paginate(args.paginationOpts);
  },
});

async function getCustomCategories(
  ctx: QueryCtx,
  userId: Id<"users">,
): Promise<string[]> {
  const categories = await ctx.db
    .query("creditCardCategories")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();
  return categories.map((category) => category.name);
}

/**
 * Lists the categories the caller created, besides the built-in ones.
 */
export const listCustomCategories = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return await getCustomCategories(ctx, userId);
  },
});

/**
 * Recategorizes one of the caller's statement lines. A name that matches no
 * existing category creates a custom one. The report aggregates follow
 * automatically; the AI summary is not regenerated.
 *
 * @param transactionId - The ID of the line.
 * @param category - A built-in, existing custom or new category name.
 * @returns The stored category name.
 */
export const updateTransactionCategory = mutation({
  args: {
    transactionId: v.id("creditCardTransactions"),
    category: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const transaction = await ctx.db.get(
      "creditCardTransactions",
      args.transactionId,
    );
    if (!transaction || transaction.userId !== userId) {
      throw new Error("Transaction not found");
    }
    const { category, isNew } = resolveCategoryName(
      args.category,
      await getCustomCategories(ctx, userId),
    );
    if (isNew) {
      await ctx.db.insert("creditCardCategories", { userId, name: category });
    }
    await ctx.db.patch("creditCardTransactions", transaction._id, {
      category,
    });
    return category;
  },
});

/**
 * Schedules a new extraction for a statement that failed.
 *
 * @param statementId - The ID of the statement.
 */
export const retryStatement = mutation({
  args: { statementId: v.id("creditCardStatements") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const statement = await requireOwnedStatement(
      ctx,
      userId,
      args.statementId,
    );
    if (statement.status !== "failed") {
      throw new Error("Only failed statements can be processed again");
    }
    await deleteStatementTransactions(ctx, statement._id);
    await ctx.db.patch("creditCardStatements", statement._id, {
      status: "pending",
      errorMessage: undefined,
    });
    await scheduleProcessing(ctx, statement._id);
    return null;
  },
});

/**
 * Deletes one of the caller's statements, its lines and the stored PDF.
 *
 * @param statementId - The ID of the statement.
 */
export const deleteStatement = mutation({
  args: { statementId: v.id("creditCardStatements") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const statement = await requireOwnedStatement(
      ctx,
      userId,
      args.statementId,
    );
    await deleteStatementTransactions(ctx, statement._id);
    await ctx.storage.delete(statement.storageId);
    await ctx.db.delete("creditCardStatements", statement._id);
    return null;
  },
});

export const getForProcessing = internalQuery({
  args: { statementId: v.id("creditCardStatements") },
  returns: v.union(v.null(), creditCardStatementValidator),
  handler: async (ctx, args) => {
    return await ctx.db.get("creditCardStatements", args.statementId);
  },
});

/**
 * Moves a pending statement to processing.
 *
 * @returns false when the statement is gone or not pending, so the caller
 * skips it.
 */
export const markProcessing = internalMutation({
  args: { statementId: v.id("creditCardStatements") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const statement = await ctx.db.get("creditCardStatements", args.statementId);
    if (!statement || statement.status !== "pending") {
      return false;
    }
    await ctx.db.patch("creditCardStatements", statement._id, {
      status: "processing",
    });
    return true;
  },
});

export const markFailed = internalMutation({
  args: {
    statementId: v.id("creditCardStatements"),
    errorMessage: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const statement = await ctx.db.get("creditCardStatements", args.statementId);
    if (!statement) {
      return null;
    }
    await ctx.db.patch("creditCardStatements", statement._id, {
      status: "failed",
      errorMessage: args.errorMessage,
    });
    return null;
  },
});

/**
 * Stores the extracted header and lines of a statement.
 *
 * @returns false when the statement was deleted meanwhile or the same issuer
 * and month was already imported (the statement is then marked as failed).
 */
export const saveExtraction = internalMutation({
  args: {
    statementId: v.id("creditCardStatements"),
    extraction: v.object({
      ...creditCardStatementExtractedFields,
      transactions: v.array(v.object(creditCardTransactionExtractedFields)),
    }),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const statement = await ctx.db.get("creditCardStatements", args.statementId);
    if (!statement) {
      return false;
    }
    const { transactions, ...header } = args.extraction;

    if (header.referenceMonth) {
      const sameMonth = await ctx.db
        .query("creditCardStatements")
        .withIndex("by_userId_and_issuer_and_referenceMonth", (q) =>
          q
            .eq("userId", statement.userId)
            .eq("issuer", statement.issuer)
            .eq("referenceMonth", header.referenceMonth),
        )
        .collect();
      const duplicate = sameMonth.some(
        (other) => other._id !== statement._id && other.status === "completed",
      );
      if (duplicate) {
        await ctx.db.patch("creditCardStatements", statement._id, {
          status: "failed",
          errorMessage: `A statement for ${header.referenceMonth} from this issuer was already imported`,
        });
        return false;
      }
    }

    await deleteStatementTransactions(ctx, statement._id);
    for (const transaction of transactions) {
      await ctx.db.insert("creditCardTransactions", {
        ...transaction,
        userId: statement.userId,
        statementId: statement._id,
      });
    }
    await ctx.db.patch("creditCardStatements", statement._id, {
      ...header,
      status: "completed",
      errorMessage: undefined,
      extractedSumCents: sumStatementCents(transactions),
    });
    return true;
  },
});

export const saveSummary = internalMutation({
  args: {
    statementId: v.id("creditCardStatements"),
    aiSummary: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const statement = await ctx.db.get("creditCardStatements", args.statementId);
    if (!statement) {
      return null;
    }
    await ctx.db.patch("creditCardStatements", statement._id, {
      aiSummary: args.aiSummary,
    });
    return null;
  },
});
