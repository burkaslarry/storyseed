/*
 * tRPC API for StorySeed.
 *
 * Routers:
 *   auth              current user and logout
 *   curriculum        class list, assignments, admin bind-member
 *   writing           create a piece and save stage versions
 *   writingEvaluation student save/get and teacher review queue
 *   teaching          teacher comments on a writing
 *   anthology         select, list, content export, PDF export
 *   accounts          CSV import, student login, first-code change
 *   writingCoach      disabled — classroom trial does not use LLM / Forge
 *
 * UNFINISHED:
 * - No procedure creates a class. Bulk import fails until a class row exists.
 * - `writing.saveVersion` stores the body as sent. Redaction is done in the
 *   browser before the call; the server redacts only on `writing.create`.
 * - Anthology PDF items are assembled in db.ts and currently label every
 *   piece as P6.
 */
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { addFeedback, archiveTrashAccount, bindClassMember, createAnthologyExport, createImportBatch, createStudentAccount, createWriting, getAnthologyPdfItems, getClassByCode, getClassMember, getClassOverview, getStudentAccountByUsername, getStudentWritingForUser, getUserByEmail, getWritingEvaluation, isDatabaseConfigured, listAnthologyDeskItems, listAnthologyItems, listAssignments, listClasses, listFeedback, listJourneyPieces, listWritingVersions, saveJourneyPiece, saveWritingEvaluation, saveWritingVersion, selectAnthologyItem, updateAnthologyItem } from "./db";
import { buildAnthologyPdf } from "./anthologyPdf";
import { assertStudentCodeChanged, hashInitialCode, normalizeTeacherEmail, parseStudentCsv, generateInitialCode, verifyInitialCode, verifyPasswordMd5 } from "./accountProvisioning";
import { setSessionCookie } from "./sessionAuth";
import { normalizeEvaluation, parseEvaluationContent } from "./writingEvaluation";
import { createManageRouter } from "./manageRouter";
import { createWritingRouters } from "./writingRouters";
import { assertTeacherClassAccess } from "./security/classAccess";
import { assertRateLimit, clientIp, rateLimitKey } from "./security/rateLimit";
import { withSlot } from "./security/concurrency";
import { assertWritingStudentWrite } from "./security/writingAccess";
import { sanitizeStudentText } from "./sanitize";

const PDF_GLOBAL_MAX = 1;
const DB_UNAVAILABLE_MSG = "系統暫時未能連接資料庫，請稍後再試。";
const PDF_BUSY_MSG = "文集 PDF 正在匯出中，請稍後再試。課堂進行期間建議課後再匯出。";
const PDF_BLOCKED_MSG = "課堂安全模式已暫停文集 PDF 匯出。請課後再試，或聯絡管理員關閉 BLOCK_ANTHOLOGY_PDF。";
const AI_DISABLED_MSG = "AI 功能已關閉。本課堂版本唔需要 BUILT_IN_FORGE_API_URL／BUILT_IN_FORGE_API_KEY。";

async function assertDatabaseReady() {
  if (!isDatabaseConfigured()) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: DB_UNAVAILABLE_MSG });
  }
}

export { sanitizeStudentText };

export async function requireRole(ctx: { user: { id: number; role: string; openId: string | null } }, allowed: Array<'student' | 'teacher' | 'tutor' | 'admin'>) {
  if (ctx.user.role === 'disabled') throw new Error('帳戶已停用。');
  if (ctx.user.role === 'admin' && allowed.includes('admin')) return;
  const platformRole = ctx.user.role === 'teacher' ? 'teacher' : ctx.user.role === 'student' ? 'student' : null;
  if (platformRole && allowed.includes(platformRole)) {
    if (platformRole === 'student' && ctx.user.openId?.startsWith('student_')) {
      const account = await getStudentAccountByUsername(ctx.user.openId.slice('student_'.length));
      if (!account?.active) throw new Error("學生帳戶已停用。");
      assertStudentCodeChanged(account.mustChangeCode);
    }
    return;
  }
  if (ctx.user.role === 'teacher' && allowed.includes('tutor')) return;
  const member = await getClassMember(ctx.user.id);
  if (!member || !allowed.includes(member.role)) throw new Error('你沒有權限進行這項操作。');
  if (member.role === 'student' && ctx.user.openId?.startsWith('student_')) {
    const account = await getStudentAccountByUsername(ctx.user.openId.slice('student_'.length));
    if (!account?.active) throw new Error("學生帳戶已停用。");
    assertStudentCodeChanged(account.mustChangeCode);
  }
}

const writingRouters = createWritingRouters(requireRole);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(({ ctx }) => {
      if (!ctx.user) return null;
      const { passwordHash: _ignored, ...safeUser } = ctx.user;
      return safeUser;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  curriculum: router({
    classes: publicProcedure.query(() => listClasses()),
    assignments: protectedProcedure
      .input(z.object({ level: z.enum(["P5", "P6"]) }))
      .query(({ ctx, input }) => {
        if (!ctx.user) throw new Error("請先登入。");
        return listAssignments(input.level);
      }),
    bindMember: protectedProcedure
      .input(
        z.object({
          classCode: z.string().max(32),
          userId: z.number(),
          schoolCode: z.string().max(32),
          role: z.enum(["student", "teacher", "tutor"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await requireRole(ctx, ["admin"]);
        const schoolClass = await getClassByCode(input.classCode);
        if (!schoolClass) throw new Error("找不到指定班別。");
        return bindClassMember({
          classId: schoolClass.id,
          userId: input.userId,
          schoolCode: input.schoolCode,
          role: input.role,
        });
      }),
  }),
  ...writingRouters,
  /*
   * [F007][S028] Anthology editing and CMYK PDF export.
   * Input: teacher/tutor/admin session, approved anthology items, display order.
   * Process: exportPdf verifies the role, loads approved items, builds the PDF
   *          in memory and returns it as base64; no file storage is involved.
   * Output: chung-sing-anthology-2026-2027.pdf downloaded by the browser.
   */
  anthology: router({ list: protectedProcedure.query(async ({ ctx }) => { await requireRole(ctx, ['teacher', 'tutor', 'admin']); return listAnthologyItems(); }), exportContent: protectedProcedure.query(async ({ ctx }) => { await requireRole(ctx, ['teacher', 'tutor', 'admin']); const items = await listAnthologyItems(); return items.map((item, index) => ({ order: item.displayOrder ?? index + 1, authorCode: item.authorCode, title: item.publicationTitle ?? 'Untitled student work', approved: Boolean(item.approved) })); }), exportPdf: protectedProcedure.mutation(async ({ ctx }) => {
      await requireRole(ctx, ['teacher', 'tutor', 'admin']);
      if (process.env.BLOCK_ANTHOLOGY_PDF === "1" || process.env.BLOCK_ANTHOLOGY_PDF === "true") {
        throw new TRPCError({ code: "FORBIDDEN", message: PDF_BLOCKED_MSG });
      }
      return withSlot("anthologyPdf", PDF_GLOBAL_MAX, PDF_BUSY_MSG, async () => {
        const items = await getAnthologyPdfItems();
        if (!items.length) throw new Error('未有已核准作品，請先將作品加入文集。');
        const pdf = await buildAnthologyPdf(items);
        const filename = 'chung-sing-anthology-2026-2027.pdf';
        await createAnthologyExport({ createdBy: ctx.user.id, format: 'pdf', storageKey: `inline:${filename}`, itemCount: items.length });
        return { filename, base64: pdf.toString('base64'), count: items.length };
      });
    }), select: protectedProcedure.input(z.object({ writingId: z.number(), authorCode: z.string().max(32), publicationTitle: z.string().max(180).optional(), displayOrder: z.number().optional(), approved: z.number().min(0).max(1) })).mutation(async ({ ctx, input }) => { await requireRole(ctx, ['teacher', 'admin']); return selectAnthologyItem(input); }) }),
  accounts: router({
    bulkImport: protectedProcedure.input(z.object({ classCode: z.string().max(32), csv: z.string().max(12000) })).mutation(async ({ ctx, input }) => {
      await requireRole(ctx, ['teacher', 'tutor', 'admin']);
      const schoolClass = await assertTeacherClassAccess(ctx.user, input.classCode);
      const rows = parseStudentCsv(input.csv, input.classCode);
      const { importStudentRoster } = await import("./studentRoster");
      return importStudentRoster(schoolClass, ctx.user.id, rows);
    }),
    teacherLogin: publicProcedure
      .input(z.object({ email: z.string().email().max(120), password: z.string().min(4).max(64) }))
      .mutation(async ({ ctx, input }) => {
        /*
         * A staff room shares one IP, so throttle per email. The IP ceiling is
         * best-effort only: X-Forwarded-For is client-controlled, so security
         * budgets must never depend on it.
         */
        await assertDatabaseReady();
        const email = normalizeTeacherEmail(input.email);
        assertRateLimit(rateLimitKey(`teacher:${email}`, "teacherLogin"), 10, 15 * 60 * 1000);
        assertRateLimit(rateLimitKey(clientIp(ctx.req), "teacherLoginIp"), 100, 15 * 60 * 1000);
        const user = await getUserByEmail(email);
        if (!user) {
          // Distinguish "DB returned nothing because pool is dead" from bad credentials.
          const { getDb } = await import("./db");
          if (!(await getDb())) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: DB_UNAVAILABLE_MSG });
          throw new TRPCError({ code: "UNAUTHORIZED", message: '電郵或密碼不正確。' });
        }
        if (!verifyPasswordMd5(input.password, user.passwordHash)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: '電郵或密碼不正確。' });
        }
        if (user.role === 'admin') {
          throw new Error('管理員請使用 /admin-login 登入。');
        }
        if (!['teacher', 'tutor'].includes(user.role)) {
          throw new Error('此帳戶不是教師權限。');
        }
        await setSessionCookie(ctx.req, ctx.res, { openId: user.openId, name: user.name ?? 'Teacher' });
        return { success: true as const };
      }),
    adminLogin: publicProcedure
      .input(z.object({ email: z.string().email().max(120), password: z.string().min(4).max(64) }))
      .mutation(async ({ ctx, input }) => {
        await assertDatabaseReady();
        const email = normalizeTeacherEmail(input.email);
        assertRateLimit(rateLimitKey(`admin:${email}`, "adminLogin"), 10, 15 * 60 * 1000);
        assertRateLimit(rateLimitKey(clientIp(ctx.req), "adminLoginIp"), 100, 15 * 60 * 1000);
        const user = await getUserByEmail(email);
        if (!user) {
          const { getDb } = await import("./db");
          if (!(await getDb())) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: DB_UNAVAILABLE_MSG });
          throw new TRPCError({ code: "UNAUTHORIZED", message: '電郵或密碼不正確。' });
        }
        if (!verifyPasswordMd5(input.password, user.passwordHash)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: '電郵或密碼不正確。' });
        }
        if (user.role !== 'admin') {
          throw new Error('此帳戶不是管理員權限。');
        }
        await setSessionCookie(ctx.req, ctx.res, { openId: user.openId, name: user.name ?? 'Admin' });
        return { success: true as const };
      }),
    studentLogin: publicProcedure.input(z.object({ username: z.string().min(3).max(64), code: z.string().min(6).max(32) })).mutation(async ({ ctx, input }) => {
      /*
       * A whole class logs in together through one school IP, so the attempt
       * budget is per student, not per IP. The key deliberately excludes the
       * IP: X-Forwarded-For is client-controlled, and rotating it must not
       * reset a student's brute-force budget. The shared-IP ceiling is only a
       * best-effort scan guard and cannot lock a class out.
       */
      await assertDatabaseReady();
      const username = input.username.trim().toLowerCase();
      assertRateLimit(rateLimitKey(`student:${username}`, "studentLogin"), 20, 15 * 60 * 1000);
      assertRateLimit(rateLimitKey(clientIp(ctx.req), "studentLoginIp"), 600, 15 * 60 * 1000);
      const { getDb, getStudentAccountByUsername: getAccount, createOrGetStudentUser } = await import("./db");
      if (!(await getDb())) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: DB_UNAVAILABLE_MSG });
      const account = await getAccount(username);
      if (!account || !account.active || !verifyInitialCode(input.code, account.initialCodeHash)) throw new TRPCError({ code: "UNAUTHORIZED", message: '帳號或初始碼不正確。' });
      const user = await createOrGetStudentUser(account.username);
      if (!user) throw new Error('無法建立學生帳戶。');
      const member = await getClassMember(user.id);
      if (!member) await bindClassMember({ classId: account.classId, userId: user.id, schoolCode: account.schoolCode, role: 'student' });
      await setSessionCookie(ctx.req, ctx.res, { openId: user.openId, name: `Student ${account.schoolCode}` });
      return { success: true, mustChangeCode: Boolean(account.mustChangeCode) };
    }),
    changeCode: protectedProcedure.input(z.object({ newCode: z.string().min(8).max(32) })).mutation(async ({ ctx, input }) => {
      if (!ctx.user.openId?.startsWith('student_')) throw new Error('只有學生帳號可以使用這項功能。');
      const username = ctx.user.openId.slice('student_'.length);
      const account = await (await import('./db')).getStudentAccountByUsername(username);
      if (!account) throw new Error('找不到學生帳戶。');
      await (await import('./db')).updateStudentAccountCode(account.id, hashInitialCode(input.newCode));
      return { success: true };
    }),
  }),
  studio: router({
    overview: protectedProcedure.query(async ({ ctx }) => {
      await requireRole(ctx, ['teacher', 'tutor', 'admin']);
      return getClassOverview();
    }),
    anthologyDesk: protectedProcedure.query(async ({ ctx }) => {
      await requireRole(ctx, ['teacher', 'tutor', 'admin']);
      const items = await listAnthologyDeskItems();
      return items.length ? items : [];
    }),
    updateAnthology: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          authorCode: z.string().max(32).optional(),
          publicationTitle: z.string().max(180).optional(),
          category: z.enum(["Fantasy", "Mystery", "Future World", "Realistic", "Poetry"]).optional(),
          status: z.enum(["待編輯", "待導師確認", "已核准", "不收錄"]).optional(),
          editorNote: z.string().max(2000).optional(),
          studentConfirmed: z.boolean().optional(),
          displayOrder: z.number().optional(),
          body: z.string().max(12000).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await requireRole(ctx, ['teacher', 'tutor', 'admin']);
        const { id, ...patch } = input;
        await updateAnthologyItem({ id, ...patch });
        return { success: true };
      }),
  }),
  journey: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      await requireRole(ctx, ['student', 'admin']);
      const rows = await listJourneyPieces(ctx.user.id);
      return Object.fromEntries(rows.map((row) => [row.lessonNo, row.body]));
    }),
    save: protectedProcedure
      .input(z.object({ lessonNo: z.number().min(1).max(15), body: z.string().max(12000), writingId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        await requireRole(ctx, ['student', 'admin']);
        if (input.writingId) await assertWritingStudentWrite(ctx, input.writingId);
        await saveJourneyPiece({ studentId: ctx.user.id, lessonNo: input.lessonNo, body: sanitizeStudentText(input.body), writingId: input.writingId });
        return { success: true };
      }),
  }),
  writingAccess: router({
    mine: protectedProcedure.input(z.object({ writingId: z.number() })).query(async ({ ctx, input }) => {
      await requireRole(ctx, ['student', 'admin']);
      return getStudentWritingForUser(ctx.user.id, input.writingId);
    }),
  }),
  manage: createManageRouter(requireRole),
  accountsArchive: router({
    trash: protectedProcedure
      .input(z.object({ username: z.string().min(3).max(64), reason: z.string().max(500).optional() }))
      .mutation(async ({ ctx, input }) => {
        await requireRole(ctx, ['teacher', 'admin']);
        return { trashId: await archiveTrashAccount(input.username, ctx.user.id, input.reason) };
      }),
  }),
  /*
   * AI / Forge coach is intentionally off for the school classroom trial.
   * Procedures remain so old clients get a clear message instead of a missing-route error.
   * No BUILT_IN_FORGE_API_URL / BUILT_IN_FORGE_API_KEY is required to run the app.
   */
  writingCoach: router({
    improve: protectedProcedure
      .input(z.object({ plan: z.string().min(1).max(3000), level: z.enum(["P5", "P6"]), lang: z.enum(["zh", "en"]) }))
      .mutation(async () => {
        throw new TRPCError({ code: "FORBIDDEN", message: AI_DISABLED_MSG });
      }),
    evaluate: protectedProcedure
      .input(z.object({ draft: z.string().max(6000), level: z.enum(["P5", "P6"]) }))
      .mutation(async () => {
        throw new TRPCError({ code: "FORBIDDEN", message: "評分已改由教師人手完成，請提交作品等待教師評分。" });
      }),
    suggest: protectedProcedure
      .input(z.object({ mode: z.enum(["idea", "language", "structure", "proofread"]), draft: z.string().max(6000), level: z.enum(["P5", "P6"]) }))
      .mutation(async () => {
        throw new TRPCError({ code: "FORBIDDEN", message: AI_DISABLED_MSG });
      }),
    ask: protectedProcedure
      .input(z.object({ question: z.string().min(1).max(1000), level: z.enum(["P5", "P6"]), lang: z.enum(["zh", "en"]) }))
      .mutation(async () => {
        throw new TRPCError({ code: "FORBIDDEN", message: AI_DISABLED_MSG });
      }),
  }),
});
export type AppRouter = typeof appRouter;
