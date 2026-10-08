import { fileURLToPath } from "node:url";
import { CfnOutput, Duration, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import * as budgets from "aws-cdk-lib/aws-budgets";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import type { Construct } from "constructs";

export interface SubscriptionTrackerStackProps extends StackProps {
  /** Receives budget alerts. Required so cost surprises are never silent. */
  alertEmail: string;
  /** Monthly cost budget in USD. */
  budgetUsd: number;
}

const servicesDir = fileURLToPath(new URL("../../services/src/", import.meta.url));

export class SubscriptionTrackerStack extends Stack {
  constructor(scope: Construct, id: string, props: SubscriptionTrackerStackProps) {
    super(scope, id, props);

    if (!props.alertEmail) {
      throw new Error("ALERT_EMAIL must be set (see .env.example)");
    }

    // --- Cost guardrail: deployed first, before anything that can cost money.
    new budgets.CfnBudget(this, "MonthlyBudget", {
      budget: {
        budgetName: `${id}-monthly`,
        budgetType: "COST",
        timeUnit: "MONTHLY",
        budgetLimit: { amount: props.budgetUsd, unit: "USD" },
      },
      notificationsWithSubscribers: [50, 80, 100].map((threshold) => ({
        notification: {
          notificationType: "ACTUAL",
          comparisonOperator: "GREATER_THAN",
          threshold,
          thresholdType: "PERCENTAGE",
        },
        subscribers: [{ subscriptionType: "EMAIL", address: props.alertEmail }],
      })),
    });

    // --- Raw inbound emails. Short-lived: parsed data lives in DynamoDB.
    const rawEmailBucket = new s3.Bucket(this, "RawEmailBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      lifecycleRules: [{ expiration: Duration.days(30) }],
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // --- Single-table design. See docs/data-model.md.
    const table = new dynamodb.TableV2(this, "Table", {
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(),
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // --- Ingest: S3 object (raw email) -> extract with Bedrock -> DynamoDB.
    const ingestFn = new NodejsFunction(this, "IngestFn", {
      entry: `${servicesDir}ingest/handler.ts`,
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 512,
      timeout: Duration.seconds(60),
      logGroup: new logs.LogGroup(this, "IngestFnLogs", {
        retention: logs.RetentionDays.TWO_WEEKS,
        removalPolicy: RemovalPolicy.DESTROY,
      }),
      environment: {
        TABLE_NAME: table.tableName,
        BEDROCK_MODEL_ID: "anthropic.claude-haiku-5-5",
      },
      bundling: { minify: true, sourceMap: true },
    });
    rawEmailBucket.grantRead(ingestFn);
    table.grantReadWriteData(ingestFn);
    // TODO(week 1): confirm the exact IAM actions/resources the Bedrock Mantle endpoint needs
    // and scope this down from "*" to the model ARN.
    ingestFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
        resources: ["*"],
      }),
    );
    rawEmailBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(ingestFn),
      { prefix: "inbound/" },
    );

    new CfnOutput(this, "RawEmailBucketName", { value: rawEmailBucket.bucketName });
    new CfnOutput(this, "TableName", { value: table.tableName });
  }
}
