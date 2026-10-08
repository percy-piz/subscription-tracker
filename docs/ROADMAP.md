# 3-week roadmap

## Week 1 — Ingest pipeline

- [x] Repo scaffold, CDK stack, budget alarm, CI
- [x] S3 raw-email bucket (30-day expiry) + DynamoDB table
- [x] Ingest Lambda skeleton: MIME parse → Bedrock extraction → DynamoDB
- [ ] `cdk bootstrap` + first deploy
- [ ] Enable Bedrock model access for Claude Haiku; confirm IAM actions and scope the policy down
- [ ] Domain + Route 53 hosted zone; verify domain in SES; MX record
- [ ] SES receipt rule set → S3 `inbound/` (add to CDK)
- [ ] Collect 10–15 real receipts (anonymized) as test fixtures in `services/test/fixtures/`
- [ ] Measure extraction accuracy on the fixtures; tweak prompt

## Week 2 — Reminders & alerts

- [ ] Sender → user mapping (replace `demo-user`)
- [ ] Schedule one-time EventBridge Scheduler reminder on `renewsOn` change
- [ ] Reminders Lambda: SES email 3 days before renewal; extra alert for free trials
- [ ] Price-change detection on new charges
- [ ] Idempotency: same email delivered twice must not double-insert
- [ ] Cognito user pool

## Week 3 — Dashboard & polish

- [ ] HTTP API + JWT authorizer; list/update subscription endpoints
- [ ] React (Vite) dashboard on Amplify: list, edit, monthly spend
- [ ] Deploy workflow (GitHub Actions + OIDC role, no long-lived keys)
- [ ] README: architecture diagram, screenshots, real cost after 2 weeks
- [ ] Stretch: "cancel this" links, CSV export, Slack/Telegram alerts
