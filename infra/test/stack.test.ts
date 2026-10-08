import { test } from "node:test";
import { App } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { SubscriptionTrackerStack } from "../lib/subscription-tracker-stack.js";

const template = Template.fromStack(
  new SubscriptionTrackerStack(new App(), "Test", { alertEmail: "test@example.com", budgetUsd: 5 }),
);

test("has a monthly budget with email alerts", () => {
  template.hasResourceProperties("AWS::Budgets::Budget", {
    Budget: Match.objectLike({ BudgetLimit: { Amount: 5, Unit: "USD" }, TimeUnit: "MONTHLY" }),
  });
});

test("raw emails expire after 30 days", () => {
  template.hasResourceProperties("AWS::S3::Bucket", {
    LifecycleConfiguration: {
      Rules: Match.arrayWith([Match.objectLike({ ExpirationInDays: 30 })]),
    },
  });
});

test("uses no always-on cost traps", () => {
  for (const type of [
    "AWS::EC2::NatGateway",
    "AWS::RDS::DBInstance",
    "AWS::ElasticLoadBalancingV2::LoadBalancer",
  ]) {
    template.resourceCountIs(type, 0);
  }
});
