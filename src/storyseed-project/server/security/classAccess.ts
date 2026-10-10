import { and, eq } from "drizzle-orm";
import { classes, studentAccounts, teacherClasses } from "../../drizzle/schema";
import { getClassByCode, getDb } from "../db";

export async function assignTeacherToClass(teacherUserId: number, classId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db
    .insert(teacherClasses)
    .values({ teacherUserId, classId })
    .onConflictDoNothing();
}

export async function teacherHasClass(teacherUserId: number, classId: number) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select()
    .from(teacherClasses)
    .where(and(eq(teacherClasses.teacherUserId, teacherUserId), eq(teacherClasses.classId, classId)))
    .limit(1);
  return rows.length > 0;
}

export async function assertTeacherClassAccess(
  user: { id: number; role: string },
  classCode: string
) {
  if (user.role === "admin") return getClassByCode(classCode);
  if (user.role !== "teacher" && user.role !== "tutor") {
    throw new Error("你沒有權限進行這項操作。");
  }
  const schoolClass = await getClassByCode(classCode);
  if (!schoolClass) throw new Error("找不到指定班別。");
  const ok = await teacherHasClass(user.id, schoolClass.id);
  if (!ok) throw new Error("你未被指派到此班別。");
  return schoolClass;
}

export async function assertTeacherClassIdAccess(user: { id: number; role: string }, classId: number) {
  if (user.role === "admin") return;
  if (user.role !== "teacher" && user.role !== "tutor") {
    throw new Error("你沒有權限進行這項操作。");
  }
  const ok = await teacherHasClass(user.id, classId);
  if (!ok) throw new Error("你未被指派到此班別。");
}

export async function assertTeacherCanAccessStudent(teacherUserId: number, studentUserId: number, role: string) {
  if (role === "admin") return;
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const account = await db
    .select()
    .from(studentAccounts)
    .where(eq(studentAccounts.userId, studentUserId))
    .limit(1);
  const classId = account[0]?.classId;
  if (!classId) throw new Error("你沒有權限查看此學生作品。");
  const ok = await teacherHasClass(teacherUserId, classId);
  if (!ok) throw new Error("你沒有權限查看此學生作品。");
}

export async function listTeacherClassCodes(teacherUserId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ code: classes.code })
    .from(teacherClasses)
    .innerJoin(classes, eq(classes.id, teacherClasses.classId))
    .where(eq(teacherClasses.teacherUserId, teacherUserId));
}
