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
    repeat: v.union(
      v.literal("none"),
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("yearly")
    ),
    repeatStartDate: v.optional(v.string()),
    repeatEndDate: v.optional(v.string()),
  })
    .index("by_amount", ["amount"])
    .index("by_date", ["date"]),
});
