import { faker } from "@faker-js/faker";
import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";

const commonExpenseArgs = {
  userId: v.id("users"),
  name: v.string(),
  description: v.optional(v.string()),
  amount: v.number(),
  category: v.string(),
  date: v.string(),
};

/**
 * Gets expenses for a specific user with optional ordering and pagination.
 *
 * @param userId - The ID of the user.
 * @param orderBy - Optional ordering criteria ("by_amount" or "by_date").
 * @param order - Optional order direction ("asc" or "desc").
 * @param paginationOpts - Optional pagination options.
 * @returns A paginated list of expenses for the user.
 */
export const getExpenses = query({
  args: {
    userId: v.id("users"),
    search: v.optional(v.string()),
    month: v.optional(v.number()),
    year: v.optional(v.number()),
    orderBy: v.optional(v.union(v.literal("by_amount"), v.literal("by_date"))),
    order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("expenses")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .filter((q) => {
        if (!args.search) return true;
        return q.or(
          q.eq(q.field("name"), args.search),
          q.eq(q.field("description"), args.search),
          q.eq(q.field("category"), args.search)
        );
      })
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
      .order(args.order || "asc")
      .paginate(args.paginationOpts);
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
    });
    return expenseId;
  },
});

/**
 * Adds duplicate expenses based on a repeat interval.
 *
 * @param args - The arguments for the new expenses.
 * @returns An array of IDs of the newly created expenses.
 */
export const addDuplicateExpense = mutation({
  args: {
    ...commonExpenseArgs,
    repeat: v.union(
      v.literal("none"),
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("yearly")
    ),
    repeatStartDate: v.string(),
    repeatEndDate: v.string(),
  },
  handler: async (ctx, args) => {
    const expenseIds: Id<"expenses">[] = [];

    const startDate = new Date(args.repeatStartDate);
    const endDate = new Date(args.repeatEndDate);

    const iterationDate = new Date(startDate);

    while (iterationDate <= endDate) {
      const expenseId = await ctx.db.insert("expenses", {
        userId: args.userId,
        name: args.name,
        description: args.description,
        amount: args.amount,
        category: args.category,
        date: iterationDate.toISOString(),
      });

      expenseIds.push(expenseId);

      if (args.repeat === "none") {
        iterationDate.setTime(endDate.getTime() + 1); // Exit the loop
        break;
      } else if (args.repeat === "daily") {
        iterationDate.setDate(iterationDate.getDate() + 1);
      } else if (args.repeat === "weekly") {
        iterationDate.setDate(iterationDate.getDate() + 7);
      } else if (args.repeat === "monthly") {
        iterationDate.setMonth(iterationDate.getMonth() + 1);
      } else if (args.repeat === "yearly") {
        iterationDate.setFullYear(iterationDate.getFullYear() + 1);
      }
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
