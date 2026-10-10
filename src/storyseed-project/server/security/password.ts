import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { ENV } from "../_core/env";

function pepper() {
  return process.env.PASSWORD_PEPPER ?? ENV.cookieSecret ?? "";
}

export function newPasswordSalt() {
  return randomBytes(16).toString("hex");
}

/** MD5(salt + pepper + plain) — school MD5 rule with salt + server pepper. */
export function hashSecretMd5(plain: string, salt: string) {
  return createHash("md5")
    .update(`${salt}${pepper()}${plain}`, "utf8")
    .digest("hex");
}

export function formatStoredSecret(salt: string, digest: string) {
  return `${salt}:${digest}`;
}

export function hashPasswordMd5(plain: string, salt = newPasswordSalt()) {
  return formatStoredSecret(salt, hashSecretMd5(plain, salt));
}

export function verifyStoredSecret(plain: string, stored: string | null | undefined) {
  if (!stored) return false;
  if (!stored.includes(":")) {
    const legacy = createHash("md5").update(plain, "utf8").digest("hex");
    const a = Buffer.from(legacy, "utf8");
    const b = Buffer.from(stored, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  }
  const [salt, digest] = stored.split(":");
  if (!salt || !digest) return false;
  const calculated = hashSecretMd5(plain, salt);
  const a = Buffer.from(calculated, "utf8");
  const b = Buffer.from(digest, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
