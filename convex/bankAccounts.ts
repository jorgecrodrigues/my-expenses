import { faker } from "@faker-js/faker";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internalMutation, mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

const accountTypeValidator = v.union(
  v.literal("checking"),
  v.literal("savings"),
  v.literal("credit"),
  v.literal("debit")
);

export const getBankAccounts = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null)
      return { page: [], isDone: true, continueCursor: "" };
    return ctx.db
      .query("bankAccounts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .paginate(args.paginationOpts);
  },
});

export const addBankAccount = mutation({
  args: {
    accountName: v.optional(v.string()),
    accountAmount: v.optional(v.number()),
    accountNumber: v.optional(v.string()),
    accountType: v.optional(accountTypeValidator),
    accountAgency: v.optional(v.string()),
    accountDigit: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    return ctx.db.insert("bankAccounts", { userId, ...args });
  },
});

export const updateBankAccount = mutation({
  args: {
    id: v.id("bankAccounts"),
    accountName: v.optional(v.string()),
    accountAmount: v.optional(v.number()),
    accountNumber: v.optional(v.string()),
    accountType: v.optional(accountTypeValidator),
    accountAgency: v.optional(v.string()),
    accountDigit: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const account = await ctx.db.get(args.id);
    if (!account || account.userId !== userId) throw new Error("Not found");
    const { id, ...fields } = args;
    return ctx.db.patch(id, fields);
  },
});

export const deleteBankAccount = mutation({
  args: { id: v.id("bankAccounts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const account = await ctx.db.get(args.id);
    if (!account || account.userId !== userId) throw new Error("Not found");
    await ctx.db.delete(args.id);
  },
});

// For development/testing purposes only

export const deleteAllBankAccounts = internalMutation(async (ctx) => {
  const allBankAccounts = await ctx.db.query("bankAccounts").collect();
  for (const bankAccount of allBankAccounts) {
    await ctx.db.delete(bankAccount._id);
  }
});

export const createFakeBankAccounts = internalMutation(async (ctx) => {
  faker.seed();

  const user = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", "jorgerodrigues9@outlook.com"))
    .first();

  if (!user) throw new Error("User not found");

  for (let i = 0; i < 200; i++) {
    await ctx.db.insert("bankAccounts", {
      userId: user._id,
      accountName: faker.finance.accountName(),
      accountAmount: parseFloat(faker.finance.amount({ min: 5, max: 1000000 })),
      accountAgency: faker.string.numeric(4),
      accountDigit: faker.string.numeric(1),
      accountNumber: faker.string.numeric(10),
      accountType: faker.helpers.arrayElement([
        "checking",
        "savings",
        "credit",
        "debit",
      ]),
    });
  }
});
