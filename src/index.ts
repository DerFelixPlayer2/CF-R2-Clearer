import * as crypto from 'crypto';
global.crypto = crypto;
import { AwsClient } from "aws4fetch";
import * as dotenv from "dotenv";
dotenv.config();

process.on('uncaughtException', (err) => {
  console.error("UNCAUGHT EXCEPTION", err, JSON.stringify(err, null, 2));
  process.exit(1);
});

const R2_URL = `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.BUCKET_NAME}`

const client = new AwsClient({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
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