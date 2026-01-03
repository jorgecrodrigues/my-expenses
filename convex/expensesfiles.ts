import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Generates a secure upload URL for storing expense-related files.
 *
 * @returns A secure upload URL.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Saves a file record in the database after it has been uploaded to storage.
 *
 * @param userId - The ID of the user uploading the file.
 * @param storageId - The ID of the file in storage.
 * @param contentType - The MIME type of the file.
 * @param filename - The name of the file.
 * @param size - The size of the file in bytes.
 */
export const sendFile = mutation({
  args: {
    userId: v.id("users"),
    expenseId: v.id("expenses"),
    storageId: v.id("_storage"),
    contentType: v.string(),
    filename: v.string(),
    size: v.number(),
    type: v.optional(
      v.union(v.literal("invoice"), v.literal("receipt"), v.literal("other"))
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("expensesFiles", {
      userId: args.userId,
      expenseId: args.expenseId,
      storageId: args.storageId,
      contentType: args.contentType,
      filename: args.filename,
      size: args.size,
      type: args.type,
    });
  },
});

/**
 * Retrieves metadata for a specific file stored in the system.
 *
 * @param storageId - The ID of the file in storage.
 */
export const getMetadata = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.system.get("_storage", args.storageId);
  },
});

export const getUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

/**
 * Retrieves all files associated with a specific expense.
 *
 * @param expenseId - The ID of the expense.
 */
export const getExpenseFiles = query({
  args: {
    expenseId: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("expensesFiles")
      .filter((q) => q.eq(q.field("expenseId"), args.expenseId))
      .collect();
  },
});

/**
 * Deletes a file both from storage and the database.
 *
 * @param fileId - The ID of the file to delete.
 */
export const deleteExpenseFile = mutation({
  args: {
    fileId: v.id("expensesFiles"),
  },
  handler: async (ctx, args) => {
    // First, retrieve the file record to get the storageId
    const file = await ctx.db.get("expensesFiles", args.fileId);
    if (!file) {
      throw new Error("File not found");
    }

    // Delete the file from storage
    await ctx.storage.delete(file.storageId);

    // Delete the file record from the database
    await ctx.db.delete("expensesFiles", args.fileId);
  },
});
