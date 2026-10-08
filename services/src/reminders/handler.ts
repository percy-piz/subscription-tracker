/**
 * Week 2: invoked by EventBridge Scheduler N days before a renewal.
 * Looks up the subscription and sends an alert via SES.
 */
export async function handler(event: { userId: string; vendorSlug: string }): Promise<void> {
  console.log(JSON.stringify({ msg: "reminder fired (not implemented yet)", ...event }));
}
