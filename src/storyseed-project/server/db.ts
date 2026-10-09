/*
 * PostgreSQL helpers for Render (storyseed_* tables).
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  anthologyExports,
  anthologyItems,
  assignments,
  classMembers,
  classes,
  feedback,
  importBatches,
  journeyPieces,
  studentAccounts,
  students,
  teachers,
  trashAccounts,
  users,
  writingAssessments,
  writingVersions,
  writings,
  type InsertUser,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _pool: pg.Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function poolConfig(): pg.PoolConfig | null {
  const url = process.env.DATABASE_URL ?? ENV.databaseUrl;
  if (!url) return null;
  const sslRequired =
    process.env.PGSSL === "true" ||
    process.env.PGSSLMODE === "require" ||
    /sslmode=require/i.test(url);
  return {
    connectionString: url,
    ssl: sslRequired ? { rejectUnauthorized: false } : undefined,
    max: 10,
  };
}

export async function getDb() {
  if (!_db) {
    const config = poolConfig();
    if (!config) return null;
    try {
      _pool = new pg.Pool(config);
      await _pool.query("SELECT 1");
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _pool = null;
      _db = null;
    }
  }
  return _db;
}

export async function checkDatabaseHealth(): Promise<{ ok: boolean; detail?: string }> {
  const config = poolConfig();
  if (!config) return { ok: false, detail: "DATABASE_URL not configured" };
  try {
    const pool = _pool ?? new pg.Pool(config);
    await pool.query("SELECT 1");
    if (!_pool) await pool.end();
    return { ok: true };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : "connection failed" };
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const role =
    user.role ??
    (user.openId === ENV.ownerOpenId ? "admin" : user.openId?.startsWith("student_") ? "student" : "teacher");
  await db
    .insert(users)
    .values({
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      passwordHash: user.passwordHash ?? null,
      loginMethod: user.loginMethod ?? null,
      role,
      lastSignedIn: user.lastSignedIn ?? new Date(),
    })
    .onConflictDoUpdate({
      target: users.openId,
      set: {
        name: user.name ?? null,
        email: user.email ?? null,
        passwordHash: user.passwordHash ?? null,
        loginMethod: user.loginMethod ?? null,
        role,
        lastSignedIn: user.lastSignedIn ?? new Date(),
        updatedAt: new Date(),
      },
    });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const normalized = email.trim().toLowerCase();
  const result = await db
    .select()
    .from(users)
    .where(sql`lower(trim(${users.email})) = ${normalized}`)
    .limit(1);
  return result[0];
}

export async function listClasses() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(classes).orderBy(classes.level, classes.code);
}

export async function listAssignments(level: "P5" | "P6") {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(assignments).where(eq(assignments.level, level)).orderBy(assignments.lessonNo);
}

export async function createWriting(input: {
  studentId: number;
  assignmentId: number;
  title?: string | null;
  stage: typeof writings.$inferInsert.stage;
  status?: string;
  level?: "P5" | "P6";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const lessonNo = input.assignmentId;
  const student = await db.select().from(students).where(eq(students.userId, input.studentId)).limit(1);
  const level = input.level ?? student[0]?.level ?? "P5";
  const existing = await db
    .select()
    .from(writings)
    .where(and(eq(writings.studentId, input.studentId), eq(writings.lessonNo, lessonNo)))
    .limit(1);
  if (existing[0]) {
    await db
      .update(writings)
      .set({
        title: input.title ?? existing[0].title,
        stage: input.stage,
        status: input.status ?? existing[0].status,
        updatedAt: new Date(),
      })
      .where(eq(writings.id, existing[0].id));
    return existing[0].id;
  }
  const [row] = await db
    .insert(writings)
    .values({
      studentId: input.studentId,
      lessonNo,
      level,
      title: input.title,
      stage: input.stage,
      status: input.status ?? "draft",
    })
    .returning({ id: writings.id });
  return row.id;
}

export async function saveWritingVersion(input: typeof writingVersions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [row] = await db.insert(writingVersions).values(input).returning({ id: writingVersions.id });
  await db
    .update(writings)
    .set({ stage: input.stage, updatedAt: new Date() })
    .where(eq(writings.id, input.writingId));
  return row.id;
}

export async function listWritingVersions(writingId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(writingVersions).where(eq(writingVersions.writingId, writingId)).orderBy(desc(writingVersions.createdAt));
}

export async function saveWritingEvaluation(input: {
  writingId: number;
  level: "P5" | "P6";
  evaluationData: string;
  reflection?: string | null;
  teacherNote?: string | null;
  rubricOverrides?: string | null;
  reviewedAt?: Date | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const evaluation = JSON.parse(input.evaluationData);
  await db
    .insert(writingAssessments)
    .values({
      writingId: input.writingId,
      level: input.level,
      evaluation,
      reflection: input.reflection ?? null,
      teacherNote: input.teacherNote ?? null,
      rubricOverrides: input.rubricOverrides ? JSON.parse(input.rubricOverrides) : {},
      reviewedAt: input.reviewedAt ?? null,
    })
    .onConflictDoUpdate({
      target: writingAssessments.writingId,
      set: {
        level: input.level,
        evaluation,
        reflection: input.reflection ?? null,
        teacherNote: input.teacherNote ?? null,
        rubricOverrides: input.rubricOverrides ? JSON.parse(input.rubricOverrides) : {},
        reviewedAt: input.reviewedAt ?? null,
        updatedAt: new Date(),
      },
    });
  return input.writingId;
}

export async function getWritingEvaluation(writingId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(writingAssessments).where(eq(writingAssessments.writingId, writingId)).limit(1);
  const row = result[0];
  if (!row) return undefined;
  return {
    writingId: row.writingId,
    level: row.level,
    evaluationData: JSON.stringify(row.evaluation),
    reflection: row.reflection,
    teacherNote: row.teacherNote,
    rubricOverrides: JSON.stringify(row.rubricOverrides ?? {}),
    reviewedAt: row.reviewedAt,
    updatedAt: row.updatedAt,
  };
}

export async function listWritingEvaluations() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      writingId: writingAssessments.writingId,
      level: writingAssessments.level,
      teacherNote: writingAssessments.teacherNote,
      reviewedAt: writingAssessments.reviewedAt,
      updatedAt: writingAssessments.updatedAt,
    })
    .from(writingAssessments)
    .orderBy(desc(writingAssessments.updatedAt));
}

export async function addFeedback(input: typeof feedback.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [row] = await db.insert(feedback).values(input).returning({ id: feedback.id });
  return row.id;
}

export async function listFeedback(writingId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(feedback).where(eq(feedback.writingId, writingId)).orderBy(desc(feedback.createdAt));
}

export async function selectAnthologyItem(input: {
  writingId: number;
  authorCode: string;
  publicationTitle?: string;
  displayOrder?: number;
  approved: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const writing = await db.select().from(writings).where(eq(writings.id, input.writingId)).limit(1);
  const versions = writing[0] ? await listWritingVersions(writing[0].id) : [];
  const body = versions[0]?.body ?? "";
  await db
    .insert(anthologyItems)
    .values({
      writingId: input.writingId,
      authorCode: input.authorCode,
      publicationTitle: input.publicationTitle ?? "Untitled student work",
      level: writing[0]?.level ?? "P5",
      body,
      displayOrder: input.displayOrder ?? 1,
      approved: Boolean(input.approved),
      status: input.approved ? "已核准" : "待編輯",
    })
    .onConflictDoUpdate({
      target: anthologyItems.writingId,
      set: {
        approved: Boolean(input.approved),
        displayOrder: input.displayOrder,
        publicationTitle: input.publicationTitle,
        status: input.approved ? "已核准" : undefined,
        updatedAt: new Date(),
      },
    });
  return input.writingId;
}

export async function updateAnthologyItem(input: {
  id: number;
  authorCode?: string;
  publicationTitle?: string;
  category?: typeof anthologyItems.$inferInsert.category;
  status?: typeof anthologyItems.$inferInsert.status;
  editorNote?: string;
  studentConfirmed?: boolean;
  displayOrder?: number;
  body?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.authorCode !== undefined) patch.authorCode = input.authorCode;
  if (input.publicationTitle !== undefined) patch.publicationTitle = input.publicationTitle;
  if (input.category !== undefined) patch.category = input.category;
  if (input.status !== undefined) {
    patch.status = input.status;
    patch.approved = input.status === "已核准";
  }
  if (input.editorNote !== undefined) patch.editorNote = input.editorNote;
  if (input.studentConfirmed !== undefined) patch.studentConfirmed = input.studentConfirmed;
  if (input.displayOrder !== undefined) patch.displayOrder = input.displayOrder;
  if (input.body !== undefined) patch.body = input.body;
  await db.update(anthologyItems).set(patch).where(eq(anthologyItems.id, input.id));
}

export async function listAnthologyItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(anthologyItems).orderBy(anthologyItems.displayOrder);
}

export async function listAnthologyDeskItems() {
  const items = await listAnthologyItems();
  return items.map((item) => ({
    id: item.id,
    student: item.authorCode,
    title: item.publicationTitle,
    level: item.level,
    status: item.status,
    body: item.body,
    category: item.category,
    order: item.displayOrder,
    note: item.editorNote,
    confirmed: item.studentConfirmed,
    writingId: item.writingId,
  }));
}

export async function getClassMember(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (user[0]?.role === "student" || user[0]?.role === "teacher" || user[0]?.role === "admin") {
    return {
      id: 0,
      classId: 0,
      userId,
      schoolCode: "",
      role: user[0].role === "admin" ? ("teacher" as const) : (user[0].role as "student" | "teacher"),
      createdAt: new Date(),
    };
  }
  const result = await db.select().from(classMembers).where(eq(classMembers.userId, userId)).limit(1);
  return result[0];
}

export async function bindClassMember(input: typeof classMembers.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [row] = await db.insert(classMembers).values(input).returning({ id: classMembers.id });
  return row.id;
}

export async function getClassByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(classes).where(eq(classes.code, code)).limit(1);
  return result[0];
}

export async function getAnthologyPdfItems() {
  const items = await listAnthologyItems();
  const output = [];
  for (const item of items.filter((entry) => entry.approved || entry.status === "已核准")) {
    output.push({
      order: item.displayOrder ?? output.length + 1,
      authorCode: item.authorCode,
      title: item.publicationTitle ?? "Untitled student work",
      body: item.body,
      level: item.level,
      category: item.category,
      editorNote: item.editorNote || null,
    });
  }
  return output;
}

export async function createAnthologyExport(input: typeof anthologyExports.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [row] = await db.insert(anthologyExports).values(input).returning({ id: anthologyExports.id });
  return row.id;
}

export async function createImportBatch(input: typeof importBatches.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [row] = await db.insert(importBatches).values(input).returning({ id: importBatches.id });
  return row.id;
}

export async function createStudentAccount(input: typeof studentAccounts.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [row] = await db.insert(studentAccounts).values(input).returning({ id: studentAccounts.id });
  return row.id;
}

export async function getStudentAccountByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(studentAccounts).where(eq(studentAccounts.username, username)).limit(1);
  return result[0];
}

export async function updateStudentAccountCode(id: number, initialCodeHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(studentAccounts).set({ initialCodeHash, mustChangeCode: false }).where(eq(studentAccounts.id, id));
}

export async function createOrGetStudentUser(username: string) {
  const openId = `student_${username}`;
  await upsertUser({ openId, name: `Student ${username}`, loginMethod: "school-code", role: "student" });
  return getUserByOpenId(openId);
}

export async function listStudentAccounts(classId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studentAccounts).where(eq(studentAccounts.classId, classId));
}

export async function listJourneyPieces(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(journeyPieces).where(eq(journeyPieces.studentId, studentId));
}

export async function saveJourneyPiece(input: { studentId: number; lessonNo: number; body: string; writingId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db
    .insert(journeyPieces)
    .values({
      studentId: input.studentId,
      lessonNo: input.lessonNo,
      body: input.body,
      writingId: input.writingId ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [journeyPieces.studentId, journeyPieces.lessonNo],
      set: { body: input.body, writingId: input.writingId ?? null, updatedAt: new Date() },
    });
}

export async function getClassOverview() {
  const db = await getDb();
  if (!db) return { classRows: [], recent: [] };
  const rows = await db.execute(sql`
    SELECT c.level AS code,
      COUNT(DISTINCT s.id)::int AS students,
      COUNT(DISTINCT w.id)::int AS pieces,
      COUNT(DISTINCT ai.id) FILTER (WHERE ai.status IN ('待編輯', '待導師確認'))::int AS pending,
      COUNT(DISTINCT ai.id) FILTER (WHERE ai.status = '已核准')::int AS approved
    FROM storyseed_classes c
    LEFT JOIN storyseed_students s ON s.class_id = c.id
    LEFT JOIN storyseed_writings w ON w.student_id = s.user_id
    LEFT JOIN storyseed_anthology_items ai ON ai.writing_id = w.id
    GROUP BY c.level
    ORDER BY c.level
  `);
  const classRows = (rows.rows as { code: string; students: number; pieces: number; pending: number; approved: number }[]) ?? [];
  const recentItems = await listAnthologyDeskItems();
  return { classRows, recent: recentItems.slice(0, 4) };
}

export async function archiveTrashAccount(username: string, originalUserId?: number, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [row] = await db
    .insert(trashAccounts)
    .values({ username, originalUserId: originalUserId ?? null, reason: reason ?? "drill soft-delete" })
    .returning({ id: trashAccounts.id });
  if (originalUserId) {
    await db.update(studentAccounts).set({ active: false }).where(eq(studentAccounts.userId, originalUserId));
  }
  return row.id;
}

export async function getStudentWritingForUser(userId: number, writingId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [writing] = await db
    .select()
    .from(writings)
    .where(and(eq(writings.id, writingId), eq(writings.studentId, userId)))
    .limit(1);
  return writing;
}
