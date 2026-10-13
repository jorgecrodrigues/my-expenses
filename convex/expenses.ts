import { faker } from "@faker-js/faker";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

const commonExpenseArgs = {
  userId: v.id("users"),
  name: v.string(),
  description: v.optional(v.string()),
  amount: v.number(),
  category: v.string(),
  date: v.string(),
  paidAt: v.optional(v.string()),
};

const expenseDocValidator = v.object({
  _id: v.id("expenses"),
  _creationTime: v.number(),
  ...commonExpenseArgs,
});

const MAX_BULK_UPDATE = 500;
const MAX_RECURRING_EXPENSES = 120;

async function requireUserId(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new Error("Not authenticated");
  }
  return userId;
}

/**
 * Gets the authenticated user's expenses whose `date` falls between `start`
 * and `end` (inclusive, compared as ISO-like strings).
 *
 * @param start - Lower bound for the expense date (e.g. "2025-01-01").
 * @param end - Upper bound for the expense date (e.g. "2025-12-31T23:59").
 * @returns The expenses in the range, ordered by date.
 */
export const getExpensesInRange = query({
  args: {
    start: v.string(),
    end: v.string(),
  },
  returns: v.array(expenseDocValidator),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return await ctx.db
      .query("expenses")
      .withIndex("by_userId_and_date", (q) =>
        q.eq("userId", userId).gte("date", args.start).lte("date", args.end),
      )
      .collect();
  },
});

/**
 * Marks the given expenses as paid (keeping any existing payment date) or
 * clears their payment date. Only expenses owned by the caller can be updated.
 *
 * @param ids - The expenses to update.
 * @param paid - Whether the expenses should be marked as paid.
 */
export const setExpensesPaid = mutation({
  args: {
    ids: v.array(v.id("expenses")),
    paid: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    if (args.ids.length > MAX_BULK_UPDATE) {
      throw new Error(
        `Too many expenses selected (max ${MAX_BULK_UPDATE} per update)`,
      );
    }

    const paidAt = new Date().toISOString();

    for (const id of args.ids) {
      const expense = await ctx.db.get(id);
      if (!expense) {
        throw new Error("Expense not found");
      }
      if (expense.userId !== userId) {
        throw new Error("Unauthorized: you don't own this expense");
      }
      if (args.paid && expense.paidAt) {
        continue;
      }
      await ctx.db.patch(id, { paidAt: args.paid ? paidAt : undefined });
    }

    return null;
  },
});

/**
 * Gets expenses for a specific user and category.
 *
 * @param userId - The ID of the user.
 * @param category - The category of expenses to retrieve.
 * @returns A list of expenses matching the user ID and category.
 */
export const getExpenseByCategory = query({
  args: {
    userId: v.id("users"),
    category: v.string(),
    year: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("expenses")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .filter((q) => q.eq(q.field("category"), args.category))
      .filter((q) => {
        if (!args.year) return true;

        return q.and(
          q.gte(q.field("date"), new Date(args.year, 0, 1).toISOString()),
          q.lte(
            q.field("date"),
            new Date(args.year, 11, 31, 23, 59, 59, 999).toISOString()
          )
        );
      })
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

export const getExpenseMinMaxYearDateOptions = query({
  handler: async (ctx) => {
    const expenses = await ctx.db.query("expenses").collect();

    if (expenses.length === 0) {
      return [];
    }

    let minYear = Infinity;
    let maxYear = -Infinity;

    for (const expense of expenses) {
      const year = new Date(expense.date).getFullYear();
      if (year < minYear) minYear = year;
      if (year > maxYear) maxYear = year;
    }

    const years: number[] = [];
    for (let year = minYear; year <= maxYear; year++) {
      years.push(year);
    }

    return years;
  },
});

export const getExpenseByCategoryValues = query({
  args: {
    userId: v.id("users"),
    month: v.optional(v.number()),
    year: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const expenses = await ctx.db
      .query("expenses")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .filter((q) => {
        if (!args.month || !args.year) return true;

        return q.and(
          q.gte(
            q.field("date"),
            new Date(args.year, args.month - 1, 1).toISOString()
          ),
          q.lte(
            q.field("date"),
            new Date(args.year, args.month, 0, 23, 59, 59, 999).toISOString()
          )
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

    // Placeholder data

    return Object.entries(categoryTotals).map(([category, total]) => ({
      category,
      total,
    }));
  },
});

/**
 * Adds a new expense to the database.
 *
 * @param args - The arguments for the new expense.
 * @returns The ID of the newly created expense.
 */
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
      date: args.date,
      paidAt: args.paidAt,
    });
    return expenseId;
  },
});

/**
 * Creates one unpaid copy of an expense for each due date in `dates`.
 * The schedule is computed by the client (in the user's local time zone).
 *
 * @param dates - ISO due dates of the new expenses.
 * @returns The IDs of the newly created expenses.
 */
export const addRecurringExpenses = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    amount: v.number(),
    category: v.string(),
    dates: v.array(v.string()),
  },
  returns: v.array(v.id("expenses")),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    const name = args.name.trim();
    const category = args.category.trim();
    if (!name) throw new Error("Expense name is required");
    if (!category) throw new Error("Expense category is required");
    if (!Number.isFinite(args.amount) || args.amount < 0) {
      throw new Error("Amount must be a positive number");
    }
    if (args.dates.length === 0) {
      throw new Error("Select at least one due date");
    }
    if (args.dates.length > MAX_RECURRING_EXPENSES) {
      throw new Error(
        `Too many repetitions (max ${MAX_RECURRING_EXPENSES} per request)`,
      );
    }

    const expenseIds: Id<"expenses">[] = [];
    for (const date of args.dates) {
      if (Number.isNaN(Date.parse(date))) {
        throw new Error(`Invalid due date: ${date}`);
      }
      expenseIds.push(
        await ctx.db.insert("expenses", {
          userId,
          name,
          description: args.description?.trim() || undefined,
          amount: args.amount,
          category,
          date,
        }),
      );
    }

    return expenseIds;
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
      date: args.date,
      paidAt: args.paidAt,
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
          from: new Date(new Date().getFullYear() - 2, 0, 1), // Jan 1st, two years ago
          to: new Date(new Date().getFullYear() + 1, 11, 31), // Dec 31st, next year
        })
        .toISOString(),
    });
    console.log(`Created expense with ID: ${expenseId}`);
  }
  console.timeEnd("Creating fake expenses");
});
