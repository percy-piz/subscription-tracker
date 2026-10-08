# Data model (DynamoDB single table)

| Entity                       | pk               | sk                                 | Notes                                                                 |
| ---------------------------- | ---------------- | ---------------------------------- | --------------------------------------------------------------------- |
| Subscription (current state) | `USER#<userId>`  | `SUB#<vendorSlug>`                 | vendor, amount, currency, billingCycle, isFreeTrial, renewsOn, status |
| Charge (history)             | `USER#<userId>`  | `CHARGE#<vendorSlug>#<YYYY-MM-DD>` | full `ExtractedReceipt` + `sourceKey` (S3 key)                        |
| Sender mapping (week 2)      | `SENDER#<email>` | `USER`                             | maps a forwarding address to a userId                                 |

## Access patterns

- List a user's subscriptions: `Query pk = USER#id, sk begins_with SUB#`
- Charge history for one vendor: `Query pk = USER#id, sk begins_with CHARGE#<vendor>#`
- Resolve user from inbound email: `GetItem pk = SENDER#<email>, sk = USER`

Add new patterns here before writing code that needs them.
