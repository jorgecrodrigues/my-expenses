import { Id } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";
import { faker } from "@faker-js/faker";

// For development/testing purposes only ...

// Deletes all bank account cards in the database.
export const deleteAllBankAccountCards = internalMutation(async (ctx) => {
  console.log("Deleting all bank account cards...");
  console.time("Deleting all bank account cards");
  const allBankAccountCards = await ctx.db.query("bankAccountCards").collect();
  for (const bankAccountCard of allBankAccountCards) {
    await ctx.db.delete(bankAccountCard._id);
    console.log(`Deleted bank account card with ID: ${bankAccountCard._id}`);
  }
  console.timeEnd("Deleting all bank account cards");
  console.log("All bank account cards deleted.");
});

// Creates 200 fake bank account cards for a specific user.
export const createFakeBankAccountCards = internalMutation(async (ctx) => {
  console.log("Creating fake bank account cards...");

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

  // Create a bank account
  console.log("Fetching bank account...");
  console.time("Fetching bank account");
  const bankAccount = await ctx.db
    .query("bankAccounts")
    .filter((q) => q.eq(q.field("userId"), user?._id as Id<"users">))
    .first();
  console.timeEnd("Fetching bank account");

  if (!bankAccount) {
    throw new Error("Bank account not found");
  }

  console.time("Creating fake bank account cards");
  for (let i = 0; i < 200; i++) {
    const bankAccountCardId = await ctx.db.insert("bankAccountCards", {
      userId: user?._id as Id<"users">,
      bankAccountId: bankAccount?._id as Id<"bankAccounts">,
      cardNumber: faker.string.numeric(16),
      cardType: faker.string.fromCharacters(['visa', 'mastercard', 'american express', 'discover']),
      cardExpirationDate: faker.date.future({ years: 5 }).toISOString().split('T')[0],
      cardSecurityCode: faker.string.numeric(3),
      cardHolderName: faker.person.fullName(),
    });
    console.log(`Created bank account card with ID: ${bankAccountCardId}`);
  }
  console.timeEnd("Creating fake bank account cards");
  console.log("All bank account cards created.");
});