import { faker } from "@faker-js/faker";
import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";

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
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("expenses")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order(args.order || "asc")
      .paginate(args.paginationOpts);
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

// For development/testing purposes only ...

// Deletes all expenses in the database.
export const deleteAllExpenses = internalMutation(async (ctx) => {
  console.log("Deleting all expenses...");
  console.time("Deleting all expenses");
  const allExpenses = await ctx.db.query("expenses").collect();
  for (const expense of allExpenses) {
    await ctx.db.delete(expense._id);
    console.log(`Deleted expense with ID: ${expense._id}`);
  }
  console.timeEnd("Deleting all expenses");
  console.log("All expenses deleted.");
});

// Creates 200 fake expenses for a specific user.
export const createFakeExpense = internalMutation(async (ctx) => {
  console.log("Creating fake expenses...");

  // Initialize Faker with a random value.
  faker.seed();

  // Create a user
  console.log("Fetching user...");
  console.time("Fetching user");
  const user = await ctx.db
    .query("users")
    .filter((q) => q.eq(q.field("email"), "jorgerodrigues9@outlook.com"))
    .first();
  console.timeEnd("Fetching user");

  if (!user) {
    throw new Error("User not found");
  }

  console.time("Creating fake expenses");
  for (let i = 0; i < 200; i++) {
    const expenseId = await ctx.db.insert("expenses", {
      userId: user?._id as Id<"users">,
      name: faker.commerce.productName(),
      description: faker.lorem.sentence(),
      amount: parseFloat(faker.commerce.price({ min: 5, max: 10000 })),
      category: faker.commerce.department(),
      date: faker.date
        .between({
          from: new Date(new Date().getFullYear(), 0, 1),
          to: new Date(new Date().getFullYear(), 11, 31),
        })
        .toISOString(),
      repeat: Array.from(["none", "daily", "weekly", "monthly", "yearly"])[
        Math.floor(Math.random() * 5)
      ] as "none" | "daily" | "weekly" | "monthly" | "yearly",
      repeatStartDate: undefined,
      repeatEndDate: undefined,
    });
    console.log(`Created expense with ID: ${expenseId}`);
  }
  console.timeEnd("Creating fake expenses");
});
