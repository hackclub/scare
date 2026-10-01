import "server-only";

import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

import { env } from "~/env";

const PREFIX = "enc:v1:";

let key: Buffer | null = null;
function getKey() {
  if (key) return key;
  const secret = env.TOKEN_ENCRYPTION_KEY ?? env.AUTH_SECRET;
  if (!secret) throw new Error("Set TOKEN_ENCRYPTION_KEY or AUTH_SECRET to store OAuth tokens.");
  key = Buffer.from(hkdfSync("sha256", secret, "scare", "oauth-token-encryption", 32));
  return key;
}

/** AES-256-GCM. Output is `enc:v1:<iv>.<tag>.<ciphertext>` (base64url). */
export function encrypt(plain: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", getKey(), iv);
  const data = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return `${PREFIX}${[iv, c.getAuthTag(), data].map((b) => b.toString("base64url")).join(".")}`;
}

/** Decrypts values from `encrypt`. Rows written before encryption existed are returned as-is. */
export function decrypt(stored: string) {
  if (!stored.startsWith(PREFIX)) return stored;
  const [iv, tag, data] = stored.slice(PREFIX.length).split(".").map((p) => Buffer.from(p ?? "", "base64url"));
  const d = createDecipheriv("aes-256-gcm", getKey(), iv!);
  d.setAuthTag(tag!);
  return Buffer.concat([d.update(data!), d.final()]).toString("utf8");
}

export const encryptOpt = <T extends string | null | undefined>(v: T) =>
  (v ? encrypt(v) : v) as T;
