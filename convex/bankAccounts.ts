import { faker } from "@faker-js/faker";
import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// For development/testing purposes only ...

// Deletes all bank accounts in the database.
export const deleteAllBankAccounts = internalMutation(async (ctx) => {
  console.log("Deleting all bank accounts...");
  console.time("Deleting all bank accounts");
  const allBankAccounts = await ctx.db.query("bankAccounts").collect();
  for (const bankAccount of allBankAccounts) {
    await ctx.db.delete(bankAccount._id);
    console.log(`Deleted bank account with ID: ${bankAccount._id}`);
  }
  console.timeEnd("Deleting all bank accounts");
  console.log("All bank accounts deleted.");
});

// Creates 200 fake bank accounts for a specific user.
export const createFakeBankAccounts = internalMutation(async (ctx) => {
  console.log("Creating fake bank accounts...");

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

  console.time("Creating fake bank accounts");
  for (let i = 0; i < 200; i++) {
    const bankAccountId = await ctx.db.insert("bankAccounts", {
      userId: user?._id as Id<"users">,
      accountName: faker.finance.accountName(),
      accountAmount: parseFloat(
        faker.finance.amount({ min: 5, max: 1000000 })
      ),
      accountAgency: faker.string.numeric(4),
      accountDigit: faker.string.numeric(1),
      accountNumber: faker.string.numeric(10),
      accountType: faker.string.fromCharacters(
        ['checking', 'savings', 'credit', 'debit']
      ),
    });
    console.log(`Created bank account with ID: ${bankAccountId}`);
  }
  console.timeEnd("Creating fake bank accounts");
  console.log("All bank accounts created.");
});