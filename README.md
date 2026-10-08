# Subscription Tracker

Forward your receipts to an email address; get warned before subscriptions renew, when free trials are
about to convert, and when prices go up.

Built serverless on AWS for ~$1–3/month.

## Architecture

```
Receipt email ──► SES (inbound) ──► S3 (raw .eml, 30-day expiry)
                                       │ ObjectCreated
                                       ▼
                               Lambda: ingest ──► Bedrock (Claude Haiku) — extract vendor/amount/cycle
                                       │
                                       ▼
                                   DynamoDB ──► EventBridge Scheduler ──► Lambda: reminders ──► SES email
                                       ▲
               React dashboard (Amplify) ── API Gateway + Cognito
```

Details: [docs/architecture.md](docs/architecture.md) · Data model: [docs/data-model.md](docs/data-model.md) ·
Plan: [docs/ROADMAP.md](docs/ROADMAP.md)

## Getting started

Prerequisites: Node 22, an AWS account, AWS CLI configured (`aws configure sso` or a named profile).

```bash
npm install
cp .env.example .env          # set ALERT_EMAIL, AWS_PROFILE, AWS_REGION
npm test                      # unit + infra tests
npx -w infra cdk bootstrap    # once per account/region
npm run deploy
```

Enable model access for Claude Haiku in the Bedrock console (once per region) before testing ingest.

Tear everything down: `npm run destroy`.

## Cost

| Service                                          | Expected monthly cost    |
| ------------------------------------------------ | ------------------------ |
| Lambda, DynamoDB, EventBridge Scheduler, Cognito | $0 (free tier)           |
| S3, SES inbound/outbound                         | < $0.05                  |
| Bedrock (Haiku, ~50 receipts)                    | < $0.50                  |
| Route 53 hosted zone                             | $0.50 (+ domain ~$12/yr) |

A $5 budget alarm is deployed as part of the stack.
