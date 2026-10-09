/*
 * PostgreSQL schema for StorySeed on Render (storyseed_* tables).
 */
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const levelCode = pgEnum("storyseed_level_code", ["P5", "P6"]);
export const memberRole = pgEnum("storyseed_member_role", ["student", "teacher", "tutor"]);
export const writingStage = pgEnum("storyseed_writing_stage", [
  "idea",
  "outline",
  "draft",
  "revision",
  "submitted",
]);
export const anthologyStatus = pgEnum("storyseed_anthology_status", [
  "待編輯",
  "待導師確認",
  "已核准",
  "不收錄",
]);
export const anthologyCategory = pgEnum("storyseed_anthology_category", [
  "Fantasy",
  "Mystery",
  "Future World",
  "Realistic",
  "Poetry",
]);
export const users = pgTable("storyseed_users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  openId: text("open_id").notNull().unique(),
  name: text("name"),
  email: text("email"),
  passwordHash: text("password_hash"),
  loginMethod: text("login_method"),
  role: text("role").default("student").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in", { withTimezone: true }).defaultNow().notNull(),
});

export const classes = pgTable("storyseed_classes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  code: text("code").notNull().unique(),
  level: levelCode("level").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const students = pgTable("storyseed_students", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id)
    .unique(),
  schoolCode: text("school_code").notNull().unique(),
  classId: integer("class_id").references(() => classes.id),
  level: levelCode("level").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const teachers = pgTable("storyseed_teachers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id)
    .unique(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const trashAccounts = pgTable("storyseed_trash_accounts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  username: text("username").notNull(),
  originalUserId: integer("original_user_id").references(() => users.id),
  reason: text("reason"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }).defaultNow().notNull(),
});

export const classMembers = pgTable(
  "storyseed_class_members",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    classId: integer("class_id")
      .notNull()
      .references(() => classes.id),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    schoolCode: text("school_code").notNull().unique(),
    role: memberRole("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("storyseed_class_members_class_user").on(t.classId, t.userId)]
);

export const classWritingAssignments = pgTable(
  "storyseed_class_assignments",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    classId: integer("class_id")
      .notNull()
      .references(() => classes.id),
    createdBy: integer("created_by")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    instructions: text("instructions").default("").notNull(),
    level: levelCode("level").notNull(),
    lessonNo: integer("lesson_no").notNull(),
    status: text("status").default("draft").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("storyseed_class_assignments_class_lesson").on(t.classId, t.lessonNo)]
);

export const assignments = pgTable("storyseed_assignments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  lessonNo: integer("lesson_no").notNull(),
  level: levelCode("level").notNull(),
  title: text("title").notNull(),
  focus: text("focus").notNull(),
  promptCard: text("prompt_card"),
  vocabulary: text("vocabulary"),
  plannerHint: text("planner_hint"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const writings = pgTable(
  "storyseed_writings",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    studentId: integer("student_id")
      .notNull()
      .references(() => users.id),
    lessonNo: integer("lesson_no").notNull(),
    level: levelCode("level").notNull(),
    title: text("title"),
    stage: writingStage("stage").default("idea").notNull(),
    status: text("status").default("draft").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("storyseed_writings_student_lesson").on(t.studentId, t.lessonNo)]
);

export const writingVersions = pgTable("storyseed_writing_versions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  writingId: integer("writing_id")
    .notNull()
    .references(() => writings.id),
  stage: writingStage("stage").notNull(),
  body: text("body").notNull(),
  studentNote: text("student_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const writingAssessments = pgTable("storyseed_writing_assessments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  writingId: integer("writing_id")
    .notNull()
    .references(() => writings.id)
    .unique(),
  level: levelCode("level").notNull(),
  evaluation: jsonb("evaluation").notNull(),
  reflection: text("reflection"),
  teacherNote: text("teacher_note"),
  rubricOverrides: jsonb("rubric_overrides").default({}).notNull(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const journeyPieces = pgTable(
  "storyseed_journey_pieces",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    studentId: integer("student_id")
      .notNull()
      .references(() => users.id),
    lessonNo: integer("lesson_no").notNull(),
    writingId: integer("writing_id").references(() => writings.id),
    body: text("body").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("storyseed_journey_student_lesson").on(t.studentId, t.lessonNo)]
);

export const feedback = pgTable("storyseed_feedback", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  writingId: integer("writing_id")
    .notNull()
    .references(() => writings.id),
  authorId: integer("author_id")
    .notNull()
    .references(() => users.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const anthologyItems = pgTable("storyseed_anthology_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  writingId: integer("writing_id")
    .unique()
    .references(() => writings.id),
  authorCode: text("author_code").notNull(),
  publicationTitle: text("publication_title").notNull(),
  level: levelCode("level").notNull(),
  category: anthologyCategory("category").default("Fantasy").notNull(),
  status: anthologyStatus("status").default("待編輯").notNull(),
  body: text("body").notNull(),
  editorNote: text("editor_note").default("").notNull(),
  studentConfirmed: boolean("student_confirmed").default(false).notNull(),
  displayOrder: integer("display_order").notNull(),
  approved: boolean("approved").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const importBatches = pgTable("storyseed_import_batches", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  importedBy: integer("imported_by")
    .notNull()
    .references(() => users.id),
  classId: integer("class_id")
    .notNull()
    .references(() => classes.id),
  rowCount: integer("row_count").notNull(),
  status: text("status").default("completed").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const studentAccounts = pgTable("storyseed_student_accounts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  classId: integer("class_id")
    .notNull()
    .references(() => classes.id),
  userId: integer("user_id").references(() => users.id),
  schoolCode: text("school_code").notNull().unique(),
  username: text("username").notNull().unique(),
  initialCodeHash: text("initial_code_hash").notNull(),
  mustChangeCode: boolean("must_change_code").default(true).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const anthologyExports = pgTable("storyseed_anthology_exports", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id),
  format: text("format").notNull(),
  storageKey: text("storage_key").notNull(),
  itemCount: integer("item_count").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
