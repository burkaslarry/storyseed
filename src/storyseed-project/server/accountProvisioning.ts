/* [F011][S021] Student ID/name/email/password CSV import, with legacy code support.
 * Uploaded passwords are validated before any insert and stored only as hashes.
 * Generated legacy codes still require a first-login code change.
 */
import { createHash, randomBytes } from "node:crypto";
import { hashPasswordMd5, verifyStoredSecret } from "./security/password";

export { hashPasswordMd5 } from "./security/password";

export type StudentImportRow = { schoolCode: string; username: string; studentName?: string; studentEmail?: string; password?: string };
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/* [F011][S021] Parse student ID, name, email and password CSV without leaking row contents.
 * Input: UTF-8 CSV and the selected class.
 * Process: Decode quoted fields, validate headers, duplicates and row limits.
 * Output: Validated students; legacy schoolCode/classCode imports remain supported.
 */
export function parseCsvCells(csv: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], cell = "", quoted = false;
  const text = csv.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') { if (quoted && text[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; }
    else if (ch === ',' && !quoted) { row.push(cell.trim()); cell = ""; }
    else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (quoted) throw new Error("CSV 引號未完整配對。");
  row.push(cell.trim()); if (row.some(Boolean)) rows.push(row);
  return rows;
}
export function parseStudentCsv(csv: string, expectedClassCode: string): StudentImportRow[] {
  const lines = parseCsvCells(csv);
  if (lines.length < 2) throw new Error("CSV 至少需要標題列及一行學生資料。");
  const headers = lines[0].map(v => v.toLowerCase().replace(/[ _-]/g, ""));
  const modern = headers.includes("studentid");
  const codeIndex = headers.indexOf(modern ? "studentid" : "schoolcode");
  const classIndex = headers.indexOf("classcode");
  const nameIndex = headers.indexOf("studentname"), emailIndex = headers.indexOf("studentemail"), passwordIndex = headers.indexOf("studentpassword");
  if (codeIndex < 0 || (modern ? [nameIndex,emailIndex,passwordIndex].some(i => i < 0) : classIndex < 0)) throw new Error("CSV 必須包含 student ID,student name,student email,student password。");
  const seen = new Set<string>(), emails = new Set<string>();
  const rows = lines.slice(1).map((cells, index) => {
    const schoolCode = cells[codeIndex] ?? "", rowNo = index + 2;
    if (!/^[A-Za-z0-9_-]{2,32}$/.test(schoolCode) || (classIndex >= 0 && cells[classIndex] !== expectedClassCode)) throw new Error(`第 ${rowNo} 行學生 ID 或班別不正確。`);
    if (seen.has(schoolCode.toLowerCase())) throw new Error(`第 ${rowNo} 行學生 ID 重複。`);
    seen.add(schoolCode.toLowerCase());
    if (!modern) return { schoolCode, username: `student-${schoolCode.toLowerCase()}` };
    const studentName = cells[nameIndex] ?? "", studentEmail = (cells[emailIndex] ?? "").toLowerCase(), password = cells[passwordIndex] ?? "";
    if (!studentName || studentName.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail) || studentEmail.length > 120 || password.length < 8 || password.length > 32) throw new Error(`第 ${rowNo} 行姓名、電郵或密碼不正確（密碼 8–32 字）。`);
    if (emails.has(studentEmail)) throw new Error(`第 ${rowNo} 行學生電郵重複。`);
    emails.add(studentEmail);
    return { schoolCode, username: schoolCode.toLowerCase(), studentName, studentEmail, password };
  });
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
