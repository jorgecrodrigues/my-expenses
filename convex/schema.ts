import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

/**
 * The Convex schema for the application.
 * This defines a single table "expenses" with the following fields:
 * - userId: string - The ID of the user who made the expense.
 * - amount: number - The amount of the expense.
 * - description: string - A description of the expense.
 * - date: optional string - The date of the expense (optional).
 */
export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),
  expenses: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    amount: v.number(),
    category: v.string(),
    date: v.string(),
    paidAt: v.optional(v.string()),
  })
    .index("by_amount", ["amount"])
    .index("by_date", ["date"]),
  expensesFiles: defineTable({
    userId: v.id("users"),
    storageId: v.id("_storage"),
    expenseId: v.id("expenses"),
    filename: v.string(),
    contentType: v.string(),
    size: v.number(),
    type: v.optional(
      v.union(v.literal("invoice"), v.literal("receipt"), v.literal("other"))
    ),
  }).index("by_filename", ["filename"]),
});
