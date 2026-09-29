/*
 * MySQL tables for StorySeed.
 * users and classMembers together decide student / teacher / tutor / admin.
 * writings + writingVersions keep each stage. writingEvaluations stores the
 * rubric JSON, student reflection, and teacher overrides.
 * studentAccounts stores a school code and a hash of the one-time code,
 * never the code itself.
 *
 * UNFINISHED: anthologyExports.format allows "pdf" and "csv" only. EPUB is
 * not a format. There is no backup or full-school export table.
 */
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const classes = mysqlTable("classes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  level: mysqlEnum("level", ["P5", "P6"]).notNull(),
  title: varchar("title", { length: 120 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const classMembers = mysqlTable("classMembers", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  userId: int("userId").notNull(),
  schoolCode: varchar("schoolCode", { length: 32 }).notNull().unique(),
  role: mysqlEnum("role", ["student", "teacher", "tutor"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const assignments = mysqlTable("assignments", {
  id: int("id").autoincrement().primaryKey(),
  lessonNo: int("lessonNo").notNull(),
  level: mysqlEnum("level", ["P5", "P6"]).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  focus: text("focus").notNull(),
  promptCard: text("promptCard"),
  vocabulary: text("vocabulary"),
  plannerHint: text("plannerHint"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const writings = mysqlTable("writings", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  assignmentId: int("assignmentId").notNull(),
  title: varchar("title", { length: 180 }),
  stage: mysqlEnum("stage", ["idea", "outline", "draft", "revision", "submitted"]).default("idea").notNull(),
  status: mysqlEnum("status", ["draft", "submitted", "approved", "selected"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const writingVersions = mysqlTable("writingVersions", {
  id: int("id").autoincrement().primaryKey(),
  writingId: int("writingId").notNull(),
  stage: mysqlEnum("stage", ["idea", "outline", "draft", "revision", "submitted"]).notNull(),
  body: text("body").notNull(),
  studentNote: text("studentNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const writingEvaluations = mysqlTable("writingEvaluations", {
  id: int("id").autoincrement().primaryKey(),
  writingId: int("writingId").notNull().unique(),
  level: mysqlEnum("level", ["P5", "P6"]).notNull(),
  evaluationData: text("evaluationData").notNull(),
  reflection: text("reflection"),
  teacherNote: text("teacherNote"),
  rubricOverrides: text("rubricOverrides"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const feedback = mysqlTable("feedback", {
  id: int("id").autoincrement().primaryKey(),
  writingId: int("writingId").notNull(),
  authorId: int("authorId").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const anthologyItems = mysqlTable("anthologyItems", {
  id: int("id").autoincrement().primaryKey(),
  writingId: int("writingId").notNull().unique(),
  displayOrder: int("displayOrder"),
  authorCode: varchar("authorCode", { length: 32 }).notNull(),
  publicationTitle: varchar("publicationTitle", { length: 180 }),
  approved: int("approved").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const importBatches = mysqlTable("importBatches", {
  id: int("id").autoincrement().primaryKey(),
  importedBy: int("importedBy").notNull(),
  classId: int("classId").notNull(),
  rowCount: int("rowCount").notNull(),
  status: mysqlEnum("status", ["preview", "completed", "failed"]).default("completed").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const studentAccounts = mysqlTable("studentAccounts", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  schoolCode: varchar("schoolCode", { length: 32 }).notNull().unique(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  initialCodeHash: varchar("initialCodeHash", { length: 128 }).notNull(),
  mustChangeCode: int("mustChangeCode").default(1).notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const anthologyExports = mysqlTable("anthologyExports", {
  id: int("id").autoincrement().primaryKey(),
  createdBy: int("createdBy").notNull(),
  format: mysqlEnum("format", ["pdf", "csv"]).notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  itemCount: int("itemCount").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
