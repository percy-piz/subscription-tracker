import type { BillingCycle } from "./schema.js";

/**
 * Next renewal date after `from` for a given cycle, in UTC (YYYY-MM-DD).
 * Month-end dates clamp (Jan 31 + 1 month -> Feb 28/29) rather than overflowing into March.
 */
export function nextRenewal(from: string, cycle: BillingCycle): string | null {
  const months: Partial<Record<BillingCycle, number>> = { monthly: 1, quarterly: 3, yearly: 12 };
  const d = new Date(`${from}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${from}`);

  if (cycle === "one_time") return null;
  if (cycle === "weekly") {
    d.setUTCDate(d.getUTCDate() + 7);
    return d.toISOString().slice(0, 10);
  }

  const add = months[cycle]!;
  const day = d.getUTCDate();
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + add, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}
