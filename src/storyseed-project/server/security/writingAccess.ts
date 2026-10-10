import { eq } from "drizzle-orm";
import { writings } from "../../drizzle/schema";
import { getDb } from "../db";
import { assertTeacherCanAccessStudent } from "./classAccess";

type CtxUser = { id: number; role: string; openId: string | null };

export async function getWritingById(writingId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db.select().from(writings).where(eq(writings.id, writingId)).limit(1);
  return row;
}

export async function assertWritingRead(ctx: { user: CtxUser }, writingId: number) {
  const writing = await getWritingById(writingId);
  if (!writing) throw new Error("找不到作品。");
  if (ctx.user.role === "admin") return writing;
  if (ctx.user.role === "student") {
    if (writing.studentId !== ctx.user.id) throw new Error("你沒有權限查看此作品。");
    return writing;
  }
  if (ctx.user.role === "teacher" || ctx.user.role === "tutor") {
    await assertTeacherCanAccessStudent(ctx.user.id, writing.studentId, ctx.user.role);
    return writing;
  }
  throw new Error("你沒有權限查看此作品。");
}

export async function assertWritingStudentWrite(ctx: { user: CtxUser }, writingId: number) {
  const writing = await assertWritingRead(ctx, writingId);
  if (ctx.user.role === "admin") return writing;
  if (ctx.user.role !== "student" || writing.studentId !== ctx.user.id) {
    throw new Error("你沒有權限修改此作品。");
  }
  return writing;
}

export async function assertWritingTeacherWrite(ctx: { user: CtxUser }, writingId: number) {
  const writing = await getWritingById(writingId);
  if (!writing) throw new Error("找不到作品。");
  if (ctx.user.role === "admin") return writing;
  if (ctx.user.role === "teacher" || ctx.user.role === "tutor") {
    await assertTeacherCanAccessStudent(ctx.user.id, writing.studentId, ctx.user.role);
    return writing;
  }
  throw new Error("你沒有權限修改此作品。");
}
