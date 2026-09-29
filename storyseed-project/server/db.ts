/*
 * MySQL helpers. `getDb()` returns null when DATABASE_URL is missing, so
 * list queries return [] and writes throw "Database unavailable".
 *
 * UNFINISHED: `getAnthologyPdfItems` copies the latest version of each
 * approved item but hard-codes level "P6" and category "Student Writing".
 * There is no seed helper for classes or assignments.
 */
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, anthologyExports, anthologyItems, assignments, classMembers, classes, feedback, importBatches, studentAccounts, users, writingEvaluations, writingVersions, writings } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
export async function getDb() { if (!_db && process.env.DATABASE_URL) { try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); } } return _db; }

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb(); if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) { if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; } }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  values.lastSignedIn ??= new Date(); updateSet.lastSignedIn ??= new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}
export async function getUserByOpenId(openId: string) { const db = await getDb(); if (!db) return undefined; const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1); return result[0]; }

export async function listClasses() { const db = await getDb(); if (!db) return []; return db.select().from(classes).orderBy(classes.level, classes.code); }
export async function listAssignments(level: 'P5' | 'P6') { const db = await getDb(); if (!db) return []; return db.select().from(assignments).where(eq(assignments.level, level)).orderBy(assignments.lessonNo); }
export async function createWriting(input: typeof writings.$inferInsert) { const db = await getDb(); if (!db) throw new Error('Database unavailable'); const result = await db.insert(writings).values(input); return Number(result[0].insertId); }
export async function saveWritingVersion(input: typeof writingVersions.$inferInsert) { const db = await getDb(); if (!db) throw new Error('Database unavailable'); const result = await db.insert(writingVersions).values(input); await db.update(writings).set({ stage: input.stage, updatedAt: new Date() }).where(eq(writings.id, input.writingId)); return Number(result[0].insertId); }
export async function listWritingVersions(writingId: number) { const db = await getDb(); if (!db) return []; return db.select().from(writingVersions).where(eq(writingVersions.writingId, writingId)).orderBy(desc(writingVersions.createdAt)); }
export async function saveWritingEvaluation(input: typeof writingEvaluations.$inferInsert) { const db = await getDb(); if (!db) throw new Error('Database unavailable'); const result = await db.insert(writingEvaluations).values(input).onDuplicateKeyUpdate({ set: { level: input.level, evaluationData: input.evaluationData, reflection: input.reflection, teacherNote: input.teacherNote, rubricOverrides: input.rubricOverrides, reviewedAt: input.reviewedAt } }); return Number(result[0].insertId); }
export async function getWritingEvaluation(writingId: number) { const db = await getDb(); if (!db) return undefined; const result = await db.select().from(writingEvaluations).where(eq(writingEvaluations.writingId, writingId)).limit(1); return result[0]; }
export async function listWritingEvaluations() { const db = await getDb(); if (!db) return []; return db.select({ writingId: writingEvaluations.writingId, level: writingEvaluations.level, teacherNote: writingEvaluations.teacherNote, reviewedAt: writingEvaluations.reviewedAt, updatedAt: writingEvaluations.updatedAt }).from(writingEvaluations).orderBy(desc(writingEvaluations.updatedAt)); }
export async function addFeedback(input: typeof feedback.$inferInsert) { const db = await getDb(); if (!db) throw new Error('Database unavailable'); const result = await db.insert(feedback).values(input); return Number(result[0].insertId); }
export async function listFeedback(writingId: number) { const db = await getDb(); if (!db) return []; return db.select().from(feedback).where(eq(feedback.writingId, writingId)).orderBy(desc(feedback.createdAt)); }
export async function selectAnthologyItem(input: typeof anthologyItems.$inferInsert) { const db = await getDb(); if (!db) throw new Error('Database unavailable'); const result = await db.insert(anthologyItems).values(input).onDuplicateKeyUpdate({ set: { approved: input.approved, displayOrder: input.displayOrder, publicationTitle: input.publicationTitle } }); return Number(result[0].insertId); }
export async function listAnthologyItems() { const db = await getDb(); if (!db) return []; return db.select().from(anthologyItems).orderBy(anthologyItems.displayOrder); }
export async function getClassMember(userId: number) { const db = await getDb(); if (!db) return undefined; const result = await db.select().from(classMembers).where(eq(classMembers.userId, userId)).limit(1); return result[0]; }
export async function bindClassMember(input: typeof classMembers.$inferInsert) { const db = await getDb(); if (!db) throw new Error('Database unavailable'); const result = await db.insert(classMembers).values(input); return Number(result[0].insertId); }
export async function getClassByCode(code: string) { const db = await getDb(); if (!db) return undefined; const result = await db.select().from(classes).where(eq(classes.code, code)).limit(1); return result[0]; }
export async function getAnthologyPdfItems() { const items = await listAnthologyItems(); const output = []; for (const item of items.filter((entry) => Boolean(entry.approved))) { const versions = await listWritingVersions(item.writingId); const latest = versions[0]; if (latest) output.push({ order: item.displayOrder ?? output.length + 1, authorCode: item.authorCode, title: item.publicationTitle ?? 'Untitled student work', body: latest.body, level: 'P6' as const, category: 'Student Writing', editorNote: null }); } return output; }
export async function createAnthologyExport(input: typeof anthologyExports.$inferInsert) { const db = await getDb(); if (!db) throw new Error('Database unavailable'); const result = await db.insert(anthologyExports).values(input); return Number(result[0].insertId); }
export async function createImportBatch(input: typeof importBatches.$inferInsert) { const db = await getDb(); if (!db) throw new Error('Database unavailable'); const result = await db.insert(importBatches).values(input); return Number(result[0].insertId); }
export async function createStudentAccount(input: typeof studentAccounts.$inferInsert) { const db = await getDb(); if (!db) throw new Error('Database unavailable'); const result = await db.insert(studentAccounts).values(input); return Number(result[0].insertId); }
export async function getStudentAccountByUsername(username: string) { const db = await getDb(); if (!db) return undefined; const result = await db.select().from(studentAccounts).where(eq(studentAccounts.username, username)).limit(1); return result[0]; }
export async function updateStudentAccountCode(id: number, initialCodeHash: string) { const db = await getDb(); if (!db) throw new Error('Database unavailable'); await db.update(studentAccounts).set({ initialCodeHash, mustChangeCode: 0 }).where(eq(studentAccounts.id, id)); }
export async function createOrGetStudentUser(username: string) { const openId = `student_${username}`; await upsertUser({ openId, name: `Student ${username}`, loginMethod: 'school-code' }); return getUserByOpenId(openId); }
export async function listStudentAccounts(classId: number) { const db = await getDb(); if (!db) return []; return db.select().from(studentAccounts).where(eq(studentAccounts.classId, classId)); }
