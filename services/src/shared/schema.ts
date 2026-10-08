import { z } from "zod";

export const BillingCycle = z.enum(["weekly", "monthly", "quarterly", "yearly", "one_time"]);
export type BillingCycle = z.infer<typeof BillingCycle>;

/** What the model extracts from a single receipt email. */
export const ExtractedReceipt = z.object({
  isSubscriptionReceipt: z
    .boolean()
    .describe("false for marketing emails, order confirmations for physical goods, etc."),
  vendor: z.string().describe("Normalized merchant name, e.g. 'Netflix'"),
  amount: z.number().describe("Amount charged, in major units (12.99, not 1299)"),
  currency: z.string().describe("ISO 4217 code, e.g. 'USD'"),
  billingCycle: BillingCycle,
  chargedOn: z.string().describe("ISO date (YYYY-MM-DD) the charge happened"),
  nextRenewalOn: z
    .string()
    .nullable()
    .describe("ISO date of next charge if stated in the email, else null"),
  isFreeTrial: z.boolean(),
});
export type ExtractedReceipt = z.infer<typeof ExtractedReceipt>;
