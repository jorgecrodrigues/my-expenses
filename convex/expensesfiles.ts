import { mutation, query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { requireUserId } from "./lib/auth";
import {
  isAcceptedExpenseFileType,
  MAX_EXPENSE_FILE_SIZE,
} from "./lib/expenseFileRules";

const expenseFileTypeValidator = v.optional(
  v.union(v.literal("invoice"), v.literal("receipt"), v.literal("other")),
);

const expenseFileWithUrlValidator = v.object({
  _id: v.id("expensesFiles"),
  _creationTime: v.number(),
  userId: v.id("users"),
  expenseId: v.id("expenses"),
  storageId: v.id("_storage"),
  filename: v.string(),
  contentType: v.string(),
  size: v.number(),
  type: expenseFileTypeValidator,
  url: v.union(v.string(), v.null()),
});

async function requireOwnedExpense(
  ctx: QueryCtx,
  userId: Id<"users">,
  expenseId: Id<"expenses">,
): Promise<Doc<"expenses">> {
  const expense = await ctx.db.get("expenses", expenseId);
  if (!expense) {
    throw new Error("Expense not found");
  }
  if (expense.userId !== userId) {
    throw new Error("Unauthorized: you don't own this expense");
  }
  return expense;
}

/**
 * Generates a single-use URL to upload one expense file to storage.
 * Call it once per file.
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
 * Attaches an uploaded file to one of the caller's expenses. Content type and
 * size are read from the stored file, not trusted from the client.
 *
 * @param expenseId - The expense the file belongs to.
 * @param storageId - The ID returned by the upload URL.
 * @param filename - The name shown to the user.
 * @returns The ID of the new file record.
 */
export const sendFile = mutation({
  args: {
    expenseId: v.id("expenses"),
    storageId: v.id("_storage"),
    filename: v.string(),
    type: expenseFileTypeValidator,
  },
  returns: v.id("expensesFiles"),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await requireOwnedExpense(ctx, userId, args.expenseId);

    const filename = args.filename.trim();
    if (!filename) {
      throw new Error("File name is required");
    }

    const metadata = await ctx.db.system.get("_storage", args.storageId);
    if (!metadata) {
      throw new Error("Uploaded file not found");
    }
    const contentType = metadata.contentType ?? "application/octet-stream";
    if (!isAcceptedExpenseFileType(contentType)) {
      throw new Error("Invalid file type. Only images and PDFs are allowed");
    }
    if (metadata.size > MAX_EXPENSE_FILE_SIZE) {
      throw new Error("File is too large (max 10 MB)");
    }

    return await ctx.db.insert("expensesFiles", {
      userId,
      expenseId: args.expenseId,
      storageId: args.storageId,
      contentType,
      filename,
      size: metadata.size,
      type: args.type,
    });
  },
});

/**
 * Lists the files attached to one of the caller's expenses, newest first,
 * each with a download URL.
 *
 * @param expenseId - The ID of the expense.
 */
export const getExpenseFiles = query({
  args: {
    expenseId: v.id("expenses"),
  },
  returns: v.array(expenseFileWithUrlValidator),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await requireOwnedExpense(ctx, userId, args.expenseId);

    const files = await ctx.db
      .query("expensesFiles")
      .withIndex("by_expenseId", (q) => q.eq("expenseId", args.expenseId))
      .order("desc")
      .collect();

    return await Promise.all(
      files.map(async (file) => ({
        ...file,
        url: await ctx.storage.getUrl(file.storageId),
      })),
    );
  },
});

/**
 * Deletes one of the caller's files from storage and the database.
 *
 * @param fileId - The ID of the file to delete.
 */
export const deleteExpenseFile = mutation({
  args: {
    fileId: v.id("expensesFiles"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    const file = await ctx.db.get("expensesFiles", args.fileId);
    if (!file) {
      throw new Error("File not found");
    }
    if (file.userId !== userId) {
      throw new Error("Unauthorized: you don't own this file");
    }

    await ctx.storage.delete(file.storageId);
    await ctx.db.delete("expensesFiles", args.fileId);
    return null;
  },
});
