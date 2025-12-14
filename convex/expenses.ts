import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const commonExpenseArgs = {
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
};

export const getExpenses = query({
  args: {
    userId: v.id("users"),
    orderBy: v.optional(v.union(v.literal("by_amount"), v.literal("by_date"))),
    order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("expenses")
      .withIndex(args.orderBy || "by_date")
      .order(args.order || "desc")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
  },
});

export const getExpenseCategoryOptions = query({
  handler: async (ctx) => {
    const categoriesSet = new Set<string>();

    (await ctx.db.query("expenses").collect()).forEach((expense) => {
      categoriesSet.add(expense.category);
    });

    return Array.from(categoriesSet).map((category) => ({
      value: category,
      label: category,
    }));
  },
});

export const getExpenseByCategoryValues = query({
  args: {
    userId: v.id("users"),
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const expenses = await ctx.db
      .query("expenses")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .filter((q) => {
        const startDate = new Date(args.year, args.month - 1, 1);
        const endDate = new Date(args.year, args.month, 0, 23, 59, 59, 999);
        return q.and(
          q.gte(q.field("date"), startDate.toISOString()),
          q.lte(q.field("date"), endDate.toISOString())
        );
      })
      .collect();

    const categoryTotals: Record<string, number> = {};

    expenses.forEach((expense) => {
      if (!categoryTotals[expense.category]) {
        categoryTotals[expense.category] = 0;
      }
      categoryTotals[expense.category] += expense.amount;
    });

    return Object.entries(categoryTotals).map(([category, total]) => ({
      category,
      total,
    }));
  },
});

export const addExpense = mutation({
  args: {
    ...commonExpenseArgs,
  },
  handler: async (ctx, args) => {
    const expenseId = await ctx.db.insert("expenses", {
      userId: args.userId,
      name: args.name,
      description: args.description,
      amount: args.amount,
      category: args.category,
      repeat: args.repeat,
      date: args.date,
    });
    return expenseId;
  },
});

export const updateExpense = mutation({
  args: {
    id: v.id("expenses"),
    ...commonExpenseArgs,
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      userId: args.userId,
      name: args.name,
      description: args.description,
      amount: args.amount,
      category: args.category,
      repeat: args.repeat,
      date: args.date,
    });
  },
});

export const deleteExpense = mutation({
  args: {
    id: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
