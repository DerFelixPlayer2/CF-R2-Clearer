declare namespace NodeJS {
  interface ProcessEnv {
    CLOUDFLARE_ACCOUNT_ID?: string;
    CF_ACCESS_KEY_ID?: string;
    CF_SECRET_ACCESS_KEY?: string;
    BUCKET_NAME?: string;
  }
}