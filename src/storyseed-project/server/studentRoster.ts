import { eq } from "drizzle-orm";
import { classes, users, students, classMembers, studentAccounts, importBatches } from "../drizzle/schema";
import { getDb } from "./db";
import { generateInitialCode, hashInitialCode, type StudentImportRow } from "./accountProvisioning";
/* [F011][S023] Import an entire student roster atomically.
 * Input: Validated rows and an authorised class.
 * Process: Hash passwords, insert linked user/profile/member/account records in one transaction.
 * Output: One-time credentials; a conflict rolls back the whole batch.
 */
export async function importStudentRoster(schoolClass: typeof classes.$inferSelect, importedBy: number, rows: StudentImportRow[]) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  try {
    return await db.transaction(async tx => {
      const credentials = [];
      for (const row of rows) {
        const password = row.password ?? generateInitialCode(), hash = hashInitialCode(password);
        const [user] = await tx.insert(users).values({ openId: `student_${row.username}`, name: row.studentName ?? `Student ${row.schoolCode}`, email: row.studentEmail, passwordHash: hash, role: "student", loginMethod: "school-code" }).returning();
        await tx.insert(students).values({ userId: user.id, schoolCode: row.schoolCode, classId: schoolClass.id, level: schoolClass.level });
        await tx.insert(classMembers).values({ userId: user.id, schoolCode: row.schoolCode, classId: schoolClass.id, role: "student" });
        await tx.insert(studentAccounts).values({ userId: user.id, classId: schoolClass.id, schoolCode: row.schoolCode, username: row.username, studentName: row.studentName, studentEmail: row.studentEmail, initialCodeHash: hash, mustChangeCode: !row.password, active: true });
        credentials.push({ schoolCode: row.schoolCode, username: row.username, studentName: row.studentName ?? "", studentEmail: row.studentEmail ?? "", initialCode: password });
      }
      const [batch] = await tx.insert(importBatches).values({ importedBy, classId: schoolClass.id, rowCount: rows.length, status: "completed" }).returning();
      return { batchId: batch.id, credentials, warning: "密碼只於本次匯入回應提供，資料庫只保留雜湊。請安全保管下載檔。" };
    });
  } catch (error) {
    const cause = (error as any)?.cause ?? error;
    if (cause?.code === "23505") throw new Error("學生 ID 或電郵已存在，整批未匯入。請先移除重複資料。");
    throw error;
  }
}
