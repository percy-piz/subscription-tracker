import "dotenv/config";
import { App } from "aws-cdk-lib";
import { SubscriptionTrackerStack } from "../lib/subscription-tracker-stack.js";

const app = new App();

new SubscriptionTrackerStack(app, "SubscriptionTracker-dev", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.AWS_REGION ?? process.env.CDK_DEFAULT_REGION ?? "us-east-1",
  },
  alertEmail: process.env.ALERT_EMAIL ?? "",
  budgetUsd: Number(process.env.BUDGET_USD ?? 5),
});
