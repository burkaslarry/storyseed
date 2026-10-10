import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  addFeedback,
  getWritingEvaluation,
  listFeedback,
  listWritingVersions,
  saveWritingEvaluation,
  saveWritingVersion,
} from "./db";
import type { requireRole } from "./routers";
import { assertWritingRead, assertWritingStudentWrite, assertWritingTeacherWrite } from "./security/writingAccess";
import { normalizeEvaluation } from "./writingEvaluation";
import { sanitizeStudentText } from "./sanitize";

type RequireRole = typeof requireRole;

export function createWritingRouters(requireRoleFn: RequireRole) {
  return {
    writing: router({
      create: protectedProcedure
        .input(
          z.object({
            assignmentId: z.number(),
            title: z.string().max(180).optional(),
            body: z.string().max(12000),
            stage: z.enum(["idea", "outline", "draft", "revision", "submitted"]),
          })
        )
        .mutation(async ({ ctx, input }) => {
          await requireRoleFn(ctx, ["student", "admin"]);
          const { createWriting } = await import("./db");
          const writingId = await createWriting({
            studentId: ctx.user.id,
            assignmentId: input.assignmentId,
            title: input.title,
            stage: input.stage,
            status: input.stage === "submitted" ? "submitted" : "draft",
          });
          await saveWritingVersion({
            writingId,
            stage: input.stage,
            body: sanitizeStudentText(input.body),
            studentNote: "初次儲存",
          });
          return { writingId };
        }),
      saveVersion: protectedProcedure
        .input(
          z.object({
            writingId: z.number(),
            stage: z.enum(["idea", "outline", "draft", "revision", "submitted"]),
            body: z.string().max(12000),
            studentNote: z.string().max(500).optional(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          await requireRoleFn(ctx, ["student", "admin"]);
          await assertWritingStudentWrite(ctx, input.writingId);
          return {
            versionId: await saveWritingVersion({
              writingId: input.writingId,
              stage: input.stage,
              body: input.body,
              studentNote: input.studentNote,
            }),
          };
        }),
      versions: protectedProcedure.input(z.object({ writingId: z.number() })).query(async ({ ctx, input }) => {
        await requireRoleFn(ctx, ["student", "teacher", "tutor", "admin"]);
        await assertWritingRead(ctx, input.writingId);
        return listWritingVersions(input.writingId);
      }),
    }),
    writingEvaluation: router({
      queue: protectedProcedure.query(async ({ ctx }) => {
        await requireRoleFn(ctx, ["teacher", "tutor", "admin"]);
        const rows = await (await import("./db")).listWritingEvaluations();
        return rows;
      }),
      save: protectedProcedure
        .input(
          z.object({
            writingId: z.number(),
            level: z.enum(["P5", "P6"]),
            evaluation: z.unknown(),
            studentRevisions: z.record(z.string(), z.string().max(1200)).default({}),
            statuses: z
              .record(z.string(), z.enum(["pending", "resolved", "needs_teacher_review"]))
              .default({}),
            reflection: z.string().max(2000).optional(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          await requireRoleFn(ctx, ["student", "admin"]);
          await assertWritingStudentWrite(ctx, input.writingId);
          const parsed = normalizeEvaluation(input.evaluation, input.level);
          const withStudentWork = {
            ...parsed,
            issues: parsed.issues.map((issue) => ({
              ...issue,
              studentRevision: input.studentRevisions[issue.id] ?? issue.studentRevision,
              status: input.statuses[issue.id] ?? issue.status,
            })),
          };
          await saveWritingEvaluation({
            writingId: input.writingId,
            level: input.level,
            evaluationData: JSON.stringify(withStudentWork),
            reflection: input.reflection ?? null,
          });
          return withStudentWork;
        }),
      get: protectedProcedure.input(z.object({ writingId: z.number() })).query(async ({ ctx, input }) => {
        await requireRoleFn(ctx, ["student", "teacher", "tutor", "admin"]);
        await assertWritingRead(ctx, input.writingId);
        const saved = await getWritingEvaluation(input.writingId);
        if (!saved) return null;
        return {
          ...normalizeEvaluation(JSON.parse(saved.evaluationData), saved.level),
          reflection: saved.reflection,
          teacherNote: saved.teacherNote,
          rubricOverrides: saved.rubricOverrides ? JSON.parse(saved.rubricOverrides as string) : {},
        };
      }),
      teacherReview: protectedProcedure
        .input(
          z.object({
            writingId: z.number(),
            teacherNote: z.string().max(2000).optional(),
            rubricOverrides: z.record(z.string(), z.number().int().min(0).max(25)).default({}),
            issueStatuses: z
              .record(z.string(), z.enum(["pending", "resolved", "needs_teacher_review"]))
              .default({}),
          })
        )
        .mutation(async ({ ctx, input }) => {
          await requireRoleFn(ctx, ["teacher", "tutor", "admin"]);
          await assertWritingTeacherWrite(ctx, input.writingId);
          const saved = await getWritingEvaluation(input.writingId);
          if (!saved) throw new Error("學生尚未保存校對評估。");
          const parsed = normalizeEvaluation(JSON.parse(saved.evaluationData), saved.level);
          const reviewed = {
            ...parsed,
            rubric: parsed.rubric.map((row) => ({
              ...row,
              score: input.rubricOverrides[row.key] ?? row.score,
            })),
            issues: parsed.issues.map((issue) => ({
              ...issue,
              status: input.issueStatuses[issue.id] ?? issue.status,
            })),
          };
          await saveWritingEvaluation({
            writingId: input.writingId,
            level: saved.level,
            evaluationData: JSON.stringify(reviewed),
            reflection: saved.reflection,
            teacherNote: input.teacherNote ?? saved.teacherNote,
            rubricOverrides: JSON.stringify(input.rubricOverrides),
            reviewedAt: new Date(),
          });
          return reviewed;
        }),
    }),
    teaching: router({
      feedback: protectedProcedure
        .input(z.object({ writingId: z.number(), body: z.string().min(1).max(2000) }))
        .mutation(async ({ ctx, input }) => {
          await requireRoleFn(ctx, ["teacher", "tutor", "admin"]);
          await assertWritingTeacherWrite(ctx, input.writingId);
          return addFeedback({ writingId: input.writingId, authorId: ctx.user.id, body: input.body });
        }),
      listFeedback: protectedProcedure.input(z.object({ writingId: z.number() })).query(async ({ ctx, input }) => {
        await requireRoleFn(ctx, ["student", "teacher", "tutor", "admin"]);
        await assertWritingRead(ctx, input.writingId);
        return listFeedback(input.writingId);
      }),
    }),
  };
}
