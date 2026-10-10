/*
 * Student CSV import and one-time codes.
 * The CSV needs schoolCode and classCode columns. Usernames are derived
 * from the school code. Only a hash of the initial code is stored.
 * `assertStudentCodeChanged` blocks protected student APIs until the
 * first-login code change is done.
 */
import { createHash, randomBytes } from "node:crypto";
import { hashPasswordMd5, verifyStoredSecret } from "./security/password";

export { hashPasswordMd5 } from "./security/password";

export type StudentImportRow = { schoolCode: string; username: string };

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function parseStudentCsv(csv: string, expectedClassCode: string): StudentImportRow[] {
  const lines = csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error("CSV 至少需要標題列及一行學生資料。");
  const headers = lines[0].split(",").map((value) => value.trim().toLowerCase());
  const codeIndex = headers.indexOf("schoolcode");
  const classIndex = headers.indexOf("classcode");
  if (codeIndex < 0 || classIndex < 0) throw new Error("CSV 必須包含 schoolCode 及 classCode 欄位。");
  const rows: StudentImportRow[] = [];
  const seen = new Set<string>();
  for (const line of lines.slice(1)) {
    const cells = line.split(",").map((value) => value.trim().replace(/^"|"$/g, ""));
    const schoolCode = cells[codeIndex] ?? "";
    const classCode = cells[classIndex] ?? "";
    if (!schoolCode || classCode !== expectedClassCode) throw new Error(`資料列的校內代號或班別不正確：${line}`);
    if (!/^[A-Za-z0-9_-]{2,32}$/.test(schoolCode)) throw new Error(`校內代號格式不正確：${schoolCode}`);
    if (seen.has(schoolCode)) throw new Error(`CSV 內有重複校內代號：${schoolCode}`);
    seen.add(schoolCode);
    rows.push({ schoolCode, username: `student-${schoolCode.toLowerCase()}` });
  }
  if (rows.length > 40) throw new Error("每次最多匯入 40 個學生帳號。");
  return rows;
}

export function generateInitialCode(length = 10) {
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export function hashInitialCode(code: string) {
  return hashPasswordMd5(code);
}

export function assertStudentCodeChanged(mustChangeCode: number | boolean | null | undefined) {
  if (Boolean(mustChangeCode)) throw new Error("請先完成首次登入改碼，完成後才可使用寫作功能。");
}

export function verifyInitialCode(code: string, stored: string) {
  return verifyStoredSecret(code, stored);
}

export function verifyPasswordMd5(plain: string, stored: string | null | undefined) {
  return verifyStoredSecret(plain, stored);
}

export function normalizeTeacherEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashImportPreview(csv: string) {
  return createHash("sha256").update(csv).digest("hex");
}
