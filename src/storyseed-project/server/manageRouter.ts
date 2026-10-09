import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getClassByCode } from "./db";
import {
  createClassWritingAssignment,
  createOneStudentAccount,
  createTeacherAccount,
  listClassWritingAssignments,
  listStudentAccountsForClass,
  listStudentsAdmin,
  listTeachersAdmin,
  openClassWritingAssignment,
  removeTeacherAccount,
  setStudentAccountActive,
  updateClassWritingAssignment,
  updateTeacherAccount,
} from "./manageDb";
import type { requireRole } from "./routers";

type RequireRole = typeof requireRole;

export function createManageRouter(requireRoleFn: RequireRole) {
  return router({
    assignments: router({
      list: protectedProcedure.input(z.object({ classCode: z.string().max(32) })).query(async ({ ctx, input }) => {
        await requireRoleFn(ctx, ["teacher", "tutor", "admin"]);
        const schoolClass = await getClassByCode(input.classCode);
        if (!schoolClass) throw new Error("找不到指定班別。");
        return listClassWritingAssignments(schoolClass.id);
      }),
      create: protectedProcedure
        .input(
          z.object({
            classCode: z.string().max(32),
            title: z.string().min(1).max(180),
            instructions: z.string().max(4000).default(""),
            level: z.enum(["P5", "P6"]),
          })
        )
        .mutation(async ({ ctx, input }) => {
          await requireRoleFn(ctx, ["teacher", "tutor", "admin"]);
          const schoolClass = await getClassByCode(input.classCode);
          if (!schoolClass) throw new Error("找不到指定班別。");
          return createClassWritingAssignment({
            classId: schoolClass.id,
            createdBy: ctx.user.id,
            title: input.title,
            instructions: input.instructions,
            level: input.level,
          });
        }),
      open: protectedProcedure.input(z.object({ assignmentId: z.number() })).mutation(async ({ ctx, input }) => {
        await requireRoleFn(ctx, ["teacher", "tutor", "admin"]);
        return openClassWritingAssignment(input.assignmentId);
      }),
      update: protectedProcedure
        .input(
          z.object({
            assignmentId: z.number(),
            title: z.string().max(180).optional(),
            instructions: z.string().max(4000).optional(),
            status: z.enum(["draft", "open", "closed"]).optional(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          await requireRoleFn(ctx, ["teacher", "tutor", "admin"]);
          const { assignmentId, ...patch } = input;
          await updateClassWritingAssignment(assignmentId, patch);
          return { success: true as const };
        }),
    }),
    students: router({
      list: protectedProcedure
        .input(z.object({ classCode: z.string().max(32).optional() }))
        .query(async ({ ctx, input }) => {
          await requireRoleFn(ctx, ["teacher", "tutor", "admin"]);
          if (ctx.user.role === "admin") return listStudentsAdmin(input.classCode);
          if (!input.classCode) throw new Error("請提供班別代碼。");
          const schoolClass = await getClassByCode(input.classCode);
          if (!schoolClass) throw new Error("找不到指定班別。");
          return listStudentAccountsForClass(schoolClass.id);
        }),
      createOne: protectedProcedure
        .input(
          z.object({
            classCode: z.string().max(32),
            schoolCode: z.string().min(2).max(32),
            initialCode: z.string().min(6).max(32).optional(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          await requireRoleFn(ctx, ["teacher", "tutor", "admin"]);
          return createOneStudentAccount(input);
        }),
      setActive: protectedProcedure
        .input(z.object({ id: z.number(), active: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
          await requireRoleFn(ctx, ["teacher", "admin"]);
          await setStudentAccountActive(input.id, input.active);
          return { success: true as const };
        }),
      exportCsv: protectedProcedure
        .input(z.object({ classCode: z.string().max(32) }))
        .query(async ({ ctx, input }) => {
          await requireRoleFn(ctx, ["teacher", "tutor", "admin"]);
          const schoolClass = await getClassByCode(input.classCode);
          if (!schoolClass) throw new Error("找不到指定班別。");
          const rows = await listStudentAccountsForClass(schoolClass.id);
          return rows.map((r) => ({
            schoolCode: r.schoolCode,
            classCode: input.classCode,
            username: r.username,
            active: r.active ? "1" : "0",
            mustChangeCode: r.mustChangeCode ? "1" : "0",
          }));
        }),
    }),
    teachers: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        await requireRoleFn(ctx, ["admin"]);
        return listTeachersAdmin();
      }),
      create: protectedProcedure
        .input(
          z.object({
            email: z.string().email(),
            password: z.string().min(6).max(64),
            displayName: z.string().min(1).max(120),
          })
        )
        .mutation(async ({ ctx, input }) => {
          await requireRoleFn(ctx, ["admin"]);
          return createTeacherAccount(input);
        }),
      update: protectedProcedure
        .input(
          z.object({
            userId: z.number(),
            email: z.string().email().optional(),
            password: z.string().min(6).max(64).optional(),
            displayName: z.string().min(1).max(120).optional(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          await requireRoleFn(ctx, ["admin"]);
          await updateTeacherAccount(input);
          return { success: true as const };
        }),
      remove: protectedProcedure.input(z.object({ userId: z.number() })).mutation(async ({ ctx, input }) => {
        await requireRoleFn(ctx, ["admin"]);
        await removeTeacherAccount(input.userId);
        return { success: true as const };
      }),
    }),
  });
}
