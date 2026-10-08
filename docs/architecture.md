# Architecture

## Flows

### 1. Ingest (week 1)

1. User forwards a receipt to `receipts@<INBOUND_DOMAIN>`.
2. SES receipt rule writes the raw MIME message to `s3://<raw-bucket>/inbound/<messageId>`.
3. S3 `ObjectCreated` triggers the **ingest** Lambda.
4. Ingest parses MIME (`mailparser`), sends the text to Bedrock with a zod schema, and gets back
   `ExtractedReceipt` (vendor, amount, currency, cycle, dates, free-trial flag).
5. Non-receipts are dropped. Receipts write a `CHARGE#` row and upsert the `SUB#` row.

### 2. Reminders (week 2)

- When a `SUB#` row's `renewsOn` changes, (re)create a one-time EventBridge Scheduler schedule for
  `renewsOn - 3 days` targeting the **reminders** Lambda.
- Reminders sends an SES email. Free trials get an extra, louder reminder.
- Price change: if a new charge's amount differs from the `SUB#` amount, send an alert immediately.

### 3. Dashboard (week 3)

- Cognito user pool for sign-in; users register the address(es) they forward from.
- API Gateway (HTTP API) + Lambda with a Cognito JWT authorizer.
- React (Vite) on Amplify Hosting: list subscriptions, edit/cancel-mark, monthly spend total.

## Decisions

| Decision                                 | Why                                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------ |
| SES inbound over Gmail API               | Works for any email provider; no OAuth app review. Needs a domain.                   |
| S3 between SES and Lambda                | SES Lambda actions don't include the body over 150KB; S3 also lets us replay.        |
| Bedrock structured output                | Receipts vary wildly; regex per vendor doesn't scale. Haiku keeps cost < 1¢/receipt. |
| DynamoDB single table                    | Access patterns are all "by user"; on-demand billing is ~free at this scale.         |
| EventBridge Scheduler one-time schedules | No polling cron; exact-time delivery; 14M free invocations/month.                    |
| CDK in TypeScript                        | Same language as Lambdas and the frontend.                                           |

## Not doing (on purpose)

VPCs, containers, relational DB, multi-region. See cost rules in `CLAUDE.md`.
