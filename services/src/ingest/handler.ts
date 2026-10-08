import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { S3Event } from "aws-lambda";
import { simpleParser } from "mailparser";
import { nextRenewal } from "../shared/dates.js";
import { extractReceipt } from "./extract.js";

const s3 = new S3Client({});
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME!;

// TODO(week 2): replace with the Cognito user resolved from the recipient address.
const USER_ID = "demo-user";

export async function handler(event: S3Event): Promise<void> {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

    const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const mail = await simpleParser(Buffer.from(await obj.Body!.transformToByteArray()));

    const receipt = await extractReceipt({
      from: mail.from?.text ?? "",
      subject: mail.subject ?? "",
      date: mail.date?.toISOString() ?? "",
      text: mail.text ?? "",
    });

    if (!receipt?.isSubscriptionReceipt) {
      console.log(JSON.stringify({ msg: "skipped non-receipt", key }));
      continue;
    }

    const renewsOn = receipt.nextRenewalOn ?? nextRenewal(receipt.chargedOn, receipt.billingCycle);
    const vendorSlug = receipt.vendor.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Charge history row + latest subscription state. See docs/data-model.md.
    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          pk: `USER#${USER_ID}`,
          sk: `CHARGE#${vendorSlug}#${receipt.chargedOn}`,
          ...receipt,
          sourceKey: key,
        },
      }),
    );
    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          pk: `USER#${USER_ID}`,
          sk: `SUB#${vendorSlug}`,
          vendor: receipt.vendor,
          amount: receipt.amount,
          currency: receipt.currency,
          billingCycle: receipt.billingCycle,
          isFreeTrial: receipt.isFreeTrial,
          renewsOn,
          updatedAt: new Date().toISOString(),
        },
      }),
    );
    console.log(JSON.stringify({ msg: "stored receipt", vendor: receipt.vendor, renewsOn }));
  }
}
