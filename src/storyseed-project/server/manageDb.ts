import { desc, eq } from "drizzle-orm";
import { classWritingAssignments, classes, studentAccounts, teachers, users } from "../drizzle/schema";
import {
  generateInitialCode,
  hashInitialCode,
  hashPasswordMd5,
  normalizeTeacherEmail,
} from "./accountProvisioning";
import {
  bindClassMember,
  createOrGetStudentUser,
  createStudentAccount,
  createWriting,
  getClassByCode,
  getClassMember,
  getDb,
  upsertUser,
} from "./db";

const TEACHER_LESSON_BASE = 1000;

export async function nextTeacherLessonNo(classId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db
    .select({ lessonNo: classWritingAssignments.lessonNo })
    .from(classWritingAssignments)
    .where(eq(classWritingAssignments.classId, classId))
    .orderBy(desc(classWritingAssignments.lessonNo))
    .limit(1);
  const max = rows[0]?.lessonNo ?? TEACHER_LESSON_BASE - 1;
  return Math.max(TEACHER_LESSON_BASE, max + 1);
}

export async function createClassWritingAssignment(input: {
  classId: number;
  createdBy: number;
  title: string;
  instructions: string;
  level: "P5" | "P6";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const lessonNo = await nextTeacherLessonNo(input.classId);
  const [row] = await db
    .insert(classWritingAssignments)
    .values({
      classId: input.classId,
      createdBy: input.createdBy,
      title: input.title,
      instructions: input.instructions,
      level: input.level,
      lessonNo,
      status: "draft",
    })
    .returning();
  return row;
}

export async function listClassWritingAssignments(classId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(classWritingAssignments)
    .where(eq(classWritingAssignments.classId, classId))
    .orderBy(desc(classWritingAssignments.createdAt));
}

export async function getClassWritingAssignment(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(classWritingAssignments).where(eq(classWritingAssignments.id, id)).limit(1);
  return rows[0];
}

export async function updateClassWritingAssignment(
  id: number,
  patch: Partial<{ title: string; instructions: string; level: "P5" | "P6"; status: string }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(classWritingAssignments).set(patch).where(eq(classWritingAssignments.id, id));
}

export async function openClassWritingAssignment(assignmentId: number) {
  const assignment = await getClassWritingAssignment(assignmentId);
  if (!assignment) throw new Error("找不到寫作任務。");
  const accounts = await listStudentAccountsForClass(assignment.classId);
  let openedFor = 0;
  for (const account of accounts) {
    if (!account.active) continue;
    const user = await createOrGetStudentUser(account.username);
    if (!user) continue;
    const member = await getClassMember(user.id);
    if (!member) {
      try {
        await bindClassMember({
          classId: assignment.classId,
          userId: user.id,
          schoolCode: account.schoolCode,
          role: "student",
        });
      } catch {
        /* already bound */
      }
    }
    await createWriting({
      studentId: user.id,
      assignmentId: assignment.lessonNo,
      title: assignment.title,
      stage: "idea",
      status: "draft",
      level: assignment.level,
    });
    openedFor += 1;
  }
  await updateClassWritingAssignment(assignmentId, { status: "open" });
  return { assignment: { ...assignment, status: "open" }, studentCount: openedFor };
}

export async function listStudentAccountsForClass(classId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studentAccounts).where(eq(studentAccounts.classId, classId)).orderBy(studentAccounts.username);
}

export async function listStudentsAdmin(classCode?: string) {
  const db = await getDb();
  if (!db) return [];
  if (classCode) {
    const schoolClass = await getClassByCode(classCode);
    if (!schoolClass) return [];
    return listStudentAccountsForClass(schoolClass.id);
  }
  return db
    .select({
      id: studentAccounts.id,
      classId: studentAccounts.classId,
      classCode: classes.code,
      schoolCode: studentAccounts.schoolCode,
      username: studentAccounts.username,
      active: studentAccounts.active,
      mustChangeCode: studentAccounts.mustChangeCode,
    })
    .from(studentAccounts)
    .innerJoin(classes, eq(classes.id, studentAccounts.classId))
    .orderBy(classes.code, studentAccounts.username);
}

export async function createOneStudentAccount(input: {
  classCode: string;
  schoolCode: string;
  initialCode?: string;
}) {
  const schoolClass = await getClassByCode(input.classCode);
  if (!schoolClass) throw new Error("找不到指定班別。");
  const username = `student-${input.schoolCode.toLowerCase()}`;
  const initialCode = input.initialCode ?? generateInitialCode();
  await createStudentAccount({
    classId: schoolClass.id,
    schoolCode: input.schoolCode,
    username,
    initialCodeHash: hashInitialCode(initialCode),
    mustChangeCode: true,
    active: true,
  });
  return { schoolCode: input.schoolCode, username, initialCode, classCode: input.classCode };
}

export async function setStudentAccountActive(id: number, active: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(studentAccounts).set({ active }).where(eq(studentAccounts.id, id));
}

export async function listTeachersAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      teacherId: teachers.id,
      userId: users.id,
      email: users.email,
      name: users.name,
      displayName: teachers.displayName,
      role: users.role,
      loginMethod: users.loginMethod,
    })
    .from(teachers)
    .innerJoin(users, eq(users.id, teachers.userId))
    .orderBy(users.email);
}

export async function createTeacherAccount(input: {
  email: string;
  password: string;
  displayName: string;
}) {
  const email = normalizeTeacherEmail(input.email);
  const openId = `teacher_${email}`;
  await upsertUser({
    openId,
    name: input.displayName,
    email,
    passwordHash: hashPasswordMd5(input.password),
    loginMethod: "password",
    role: "teacher",
  });
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const user = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  if (!user[0]) throw new Error("無法建立教師帳戶。");
  await db
    .insert(teachers)
    .values({ userId: user[0].id, displayName: input.displayName })
    .onConflictDoUpdate({
      target: teachers.userId,
      set: { displayName: input.displayName },
    });
  return { userId: user[0].id, email };
}

export async function updateTeacherAccount(input: {
  userId: number;
  email?: string;
  password?: string;
  displayName?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.email) {
    patch.email = normalizeTeacherEmail(input.email);
    patch.openId = `teacher_${patch.email as string}`;
  }
  if (input.password) patch.passwordHash = hashPasswordMd5(input.password);
  if (input.displayName) patch.name = input.displayName;
  if (Object.keys(patch).length > 1) {
    await db.update(users).set(patch).where(eq(users.id, input.userId));
  }
  if (input.displayName) {
    await db.update(teachers).set({ displayName: input.displayName }).where(eq(teachers.userId, input.userId));
  }
}

export async function removeTeacherAccount(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(teachers).where(eq(teachers.userId, userId));
  await db
    .update(users)
    .set({ role: "student", loginMethod: "disabled", passwordHash: null, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function createAdminUser(input: { email: string; password: string; name: string }) {
  const email = normalizeTeacherEmail(input.email);
  const openId = `admin_${email}`;
  await upsertUser({
    openId,
    name: input.name,
    email,
    passwordHash: hashPasswordMd5(input.password),
    loginMethod: "password",
    role: "admin",
  });
}
