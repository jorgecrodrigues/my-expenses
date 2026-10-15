/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as bankAccountCards from "../bankAccountCards.js";
import type * as bankAccounts from "../bankAccounts.js";
import type * as creditCardStatements from "../creditCardStatements.js";
import type * as creditCardStatementsActions from "../creditCardStatementsActions.js";
import type * as expenses from "../expenses.js";
import type * as expensesfiles from "../expensesfiles.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_creditCardExtraction from "../lib/creditCardExtraction.js";
import type * as lib_creditCardReport from "../lib/creditCardReport.js";
import type * as lib_creditCardRules from "../lib/creditCardRules.js";
import type * as lib_creditCardValidators from "../lib/creditCardValidators.js";
import type * as lib_expenseFileRules from "../lib/expenseFileRules.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  bankAccountCards: typeof bankAccountCards;
  bankAccounts: typeof bankAccounts;
  creditCardStatements: typeof creditCardStatements;
  creditCardStatementsActions: typeof creditCardStatementsActions;
  expenses: typeof expenses;
  expensesfiles: typeof expensesfiles;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/creditCardExtraction": typeof lib_creditCardExtraction;
  "lib/creditCardReport": typeof lib_creditCardReport;
  "lib/creditCardRules": typeof lib_creditCardRules;
  "lib/creditCardValidators": typeof lib_creditCardValidators;
  "lib/expenseFileRules": typeof lib_expenseFileRules;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
