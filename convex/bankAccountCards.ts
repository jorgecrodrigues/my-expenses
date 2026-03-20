import { faker } from "@faker-js/faker";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";

const cardTypeValidator = v.union(
  v.literal("visa"),
  v.literal("mastercard"),
  v.literal("american express"),
  v.literal("discover")
);

export const getBankAccountCards = query({
  args: {
    bankAccountId: v.optional(v.id("bankAccounts")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];

    if (args.bankAccountId) {
      return ctx.db
        .query("bankAccountCards")
        .withIndex("by_bankAccountId", (q) =>
          q.eq("bankAccountId", args.bankAccountId!)
        )
        .filter((q) => q.eq(q.field("userId"), userId))
        .collect();
    }

    return ctx.db
      .query("bankAccountCards")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const addBankAccountCard = mutation({
  args: {
    bankAccountId: v.id("bankAccounts"),
    cardNumber: v.optional(v.string()),
    cardType: v.optional(cardTypeValidator),
    cardExpirationDate: v.optional(v.string()),
    cardSecurityCode: v.optional(v.string()),
    cardHolderName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const account = await ctx.db.get(args.bankAccountId);
    if (!account || account.userId !== userId) throw new Error("Not found");
    return ctx.db.insert("bankAccountCards", { userId, ...args });
  },
});

export const updateBankAccountCard = mutation({
  args: {
    id: v.id("bankAccountCards"),
    cardNumber: v.optional(v.string()),
    cardType: v.optional(cardTypeValidator),
    cardExpirationDate: v.optional(v.string()),
    cardSecurityCode: v.optional(v.string()),
    cardHolderName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const card = await ctx.db.get(args.id);
    if (!card || card.userId !== userId) throw new Error("Not found");
    const { id, ...fields } = args;
    return ctx.db.patch(id, fields);
  },
});

export const deleteBankAccountCard = mutation({
  args: { id: v.id("bankAccountCards") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const card = await ctx.db.get(args.id);
    if (!card || card.userId !== userId) throw new Error("Not found");
    await ctx.db.delete(args.id);
  },
});

// For development/testing purposes only

export const deleteAllBankAccountCards = internalMutation(async (ctx) => {
  const allCards = await ctx.db.query("bankAccountCards").collect();
  for (const card of allCards) {
    await ctx.db.delete(card._id);
  }
});

export const createFakeBankAccountCards = internalMutation(async (ctx) => {
  faker.seed();

  const user = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", "jorgerodrigues9@outlook.com"))
    .first();

  if (!user) throw new Error("User not found");

  const bankAccount = await ctx.db
    .query("bankAccounts")
    .withIndex("by_userId", (q) => q.eq("userId", user._id))
    .first();

  if (!bankAccount) throw new Error("Bank account not found");

  for (let i = 0; i < 200; i++) {
    await ctx.db.insert("bankAccountCards", {
      userId: user._id,
      bankAccountId: bankAccount._id,
      cardNumber: faker.string.numeric(16),
      cardType: faker.helpers.arrayElement([
        "visa",
        "mastercard",
        "american express",
        "discover",
      ]),
      cardExpirationDate: faker.date
        .future({ years: 5 })
        .toISOString()
        .split("T")[0],
      cardSecurityCode: faker.string.numeric(3),
      cardHolderName: faker.person.fullName(),
    });
  }
});
