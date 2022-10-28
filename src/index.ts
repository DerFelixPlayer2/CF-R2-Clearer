import * as crypto from 'crypto';
global.crypto = crypto;
import { AwsClient } from "aws4fetch";
import * as dotenv from "dotenv";
dotenv.config();

if (!process.env.CF_ACCESS_KEY_ID) {
  console.error("Environment variable 'CF_ACCESS_KEY_ID' is not set");
  process.exit(1);
}
if (!process.env.CF_SECRET_ACCESS_KEY) {
  console.error("Environment variable 'CF_SECRET_ACCESS_KEY' is not set");
  process.exit(1);
}
if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
  console.error("Environment variable 'CF_ACCOUNT_ID' is not set");
  process.exit(1);
}
if (!process.env.BUCKET_NAME) {
  console.error("Environment variable 'BUCKET_NAME' is not set");
  process.exit(1);
}

process.on('uncaughtException', (err) => {
  console.error("UNCAUGHT EXCEPTION", err, JSON.stringify(err, null, 2));
  process.exit(1);
});

const R2_URL = `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.BUCKET_NAME}`

const client = new AwsClient({
  accessKeyId: process.env.CF_ACCESS_KEY_ID,
  secretAccessKey: process.env.CF_SECRET_ACCESS_KEY,
  service: "s3",
  region: "auto",
});

(async () => {
  let continuation_token = null;
  let truncated = true;
  let success = 0, failure = 0;

  while (truncated) {
    const res = await client.fetch(`${R2_URL}?list-type=2` + (continuation_token ? `&continuation-token=${continuation_token}` : ""));
    const text = await res.text();
    continuation_token = text.split("<NextContinuationToken>")[1]?.split("</NextContinuationToken>")[0];
    truncated = text.split("<IsTruncated>true</IsTruncated>").length > 1;
    const keys = text.split("<Key>").map((x) => x.split("</Key>")[0]).slice(1);

    for (const key of keys) {
      console.log("Deleting", key);
      const r = await client.fetch(`${R2_URL}/${key}`, { method: "DELETE", });
      if (r.status !== 204) {
        console.log(r.status, key)
        failure++;
      } else success++;
    }
  }
  console.log("Done");
  console.log("Success", success);
  console.log("Failure", failure);
})()