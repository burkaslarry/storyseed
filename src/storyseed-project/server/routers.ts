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
 *   writingCoach      evaluate, suggest, and the lesson "ask" coach
 *
 * The coach must not write a complete story. `safeWritingRules` and
 * `sanitizeStudentText` enforce that before any LLM call.
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
import { invokeLLM } from "./_core/llm";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { addFeedback, archiveTrashAccount, bindClassMember, createAnthologyExport, createImportBatch, createStudentAccount, createWriting, getAnthologyPdfItems, getClassByCode, getClassMember, getClassOverview, getStudentAccountByUsername, getStudentWritingForUser, getUserByEmail, getWritingEvaluation, listAnthologyDeskItems, listAnthologyItems, listAssignments, listClasses, listFeedback, listJourneyPieces, listWritingVersions, saveJourneyPiece, saveWritingEvaluation, saveWritingVersion, selectAnthologyItem, updateAnthologyItem } from "./db";
import { buildAnthologyPdf } from "./anthologyPdf";
import { assertStudentCodeChanged, hashInitialCode, normalizeTeacherEmail, parseStudentCsv, generateInitialCode, verifyInitialCode, verifyPasswordMd5 } from "./accountProvisioning";
import { setSessionCookie } from "./sessionAuth";
import { storagePut } from "./storage";
import { normalizeEvaluation, parseEvaluationContent } from "./writingEvaluation";
import { createManageRouter } from "./manageRouter";

const supportMode = z.enum(["idea", "language", "structure", "proofread"]);
export function sanitizeStudentText(text: string) { return text.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[電郵已隱去]").replace(/(?:\+?852[ -]?)?\d{4}[ -]?\d{4}/g, "[電話已隱去]"); }
export async function requireRole(ctx: { user: { id: number; role: string; openId: string | null } }, allowed: Array<'student' | 'teacher' | 'tutor' | 'admin'>) {
  if (ctx.user.role === 'admin' && allowed.includes('admin')) return;
  const platformRole = ctx.user.role === 'teacher' ? 'teacher' : ctx.user.role === 'student' ? 'student' : null;
  if (platformRole && allowed.includes(platformRole)) {
    if (platformRole === 'student' && ctx.user.openId?.startsWith('student_')) {
      const account = await getStudentAccountByUsername(ctx.user.openId.slice('student_'.length));
      assertStudentCodeChanged(account?.mustChangeCode);
    }
    return;
  }
  if (ctx.user.role === 'teacher' && allowed.includes('tutor')) return;
  const member = await getClassMember(ctx.user.id);
  if (!member || !allowed.includes(member.role)) throw new Error('你沒有權限進行這項操作。');
  if (member.role === 'student' && ctx.user.openId?.startsWith('student_')) {
    const account = await getStudentAccountByUsername(ctx.user.openId.slice('student_'.length));
    assertStudentCodeChanged(account?.mustChangeCode);
  }
}

const safeWritingRules = `You are StorySeed, a supportive AI writing coach for Hong Kong primary students in P5/P6. You must never write a complete story, paragraph, essay, poem, dialogue scene, or replacement draft for the student. You may ask guiding questions, offer up to five vocabulary choices with short explanations, point out one or two structural observations, or identify proofreading issues without rewriting the whole text. Always preserve the student's original voice and remind them to make the final choices. Never ask for or infer the student's real name, phone number, email, address, school ID, family information, or other sensitive personal data. If the student asks you to write the whole piece, politely refuse and offer a small next step instead.`;

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
  curriculum: router({ classes: publicProcedure.query(() => listClasses()), assignments: publicProcedure.input(z.object({ level: z.enum(["P5", "P6"]) })).query(({ input }) => listAssignments(input.level)), bindMember: protectedProcedure.input(z.object({ classCode: z.string().max(32), userId: z.number(), schoolCode: z.string().max(32), role: z.enum(["student", "teacher", "tutor"]) })).mutation(async ({ ctx, input }) => { await requireRole(ctx, ['admin']); const schoolClass = await getClassByCode(input.classCode); if (!schoolClass) throw new Error('找不到指定班別。'); return bindClassMember({ classId: schoolClass.id, userId: input.userId, schoolCode: input.schoolCode, role: input.role }); }) }),
  writing: router({
    create: protectedProcedure.input(z.object({ assignmentId: z.number(), title: z.string().max(180).optional(), body: z.string().max(12000), stage: z.enum(["idea", "outline", "draft", "revision", "submitted"]) })).mutation(async ({ ctx, input }) => { await requireRole(ctx, ['student', 'admin']); const writingId = await createWriting({ studentId: ctx.user.id, assignmentId: input.assignmentId, title: input.title, stage: input.stage, status: input.stage === 'submitted' ? 'submitted' : 'draft' }); await saveWritingVersion({ writingId, stage: input.stage, body: sanitizeStudentText(input.body), studentNote: '初次儲存' }); return { writingId }; }),
    saveVersion: protectedProcedure.input(z.object({ writingId: z.number(), stage: z.enum(["idea", "outline", "draft", "revision", "submitted"]), body: z.string().max(12000), studentNote: z.string().max(500).optional() })).mutation(async ({ ctx, input }) => { await requireRole(ctx, ['student', 'admin']); return { versionId: await saveWritingVersion({ writingId: input.writingId, stage: input.stage, body: input.body, studentNote: input.studentNote }) }; }),
    versions: protectedProcedure.input(z.object({ writingId: z.number() })).query(async ({ ctx, input }) => { await requireRole(ctx, ['student', 'teacher', 'tutor', 'admin']); return listWritingVersions(input.writingId); }),
  }),
  writingEvaluation: router({
    queue: protectedProcedure.query(async ({ ctx }) => { await requireRole(ctx, ['teacher', 'tutor', 'admin']); const rows = await (await import('./db')).listWritingEvaluations(); return rows; }),
    save: protectedProcedure.input(z.object({ writingId: z.number(), level: z.enum(["P5", "P6"]), evaluation: z.unknown(), studentRevisions: z.record(z.string(), z.string().max(1200)).default({}), statuses: z.record(z.string(), z.enum(["pending", "resolved", "needs_teacher_review"])).default({}), reflection: z.string().max(2000).optional() })).mutation(async ({ ctx, input }) => { await requireRole(ctx, ['student', 'admin']); const parsed = normalizeEvaluation(input.evaluation, input.level); const withStudentWork = { ...parsed, issues: parsed.issues.map((issue) => ({ ...issue, studentRevision: input.studentRevisions[issue.id] ?? issue.studentRevision, status: input.statuses[issue.id] ?? issue.status })) }; await saveWritingEvaluation({ writingId: input.writingId, level: input.level, evaluationData: JSON.stringify(withStudentWork), reflection: input.reflection ?? null }); return withStudentWork; }),
    get: protectedProcedure.input(z.object({ writingId: z.number() })).query(async ({ ctx, input }) => { await requireRole(ctx, ['student', 'teacher', 'tutor', 'admin']); const saved = await getWritingEvaluation(input.writingId); if (!saved) return null; return { ...normalizeEvaluation(JSON.parse(saved.evaluationData), saved.level), reflection: saved.reflection, teacherNote: saved.teacherNote, rubricOverrides: saved.rubricOverrides ? JSON.parse(saved.rubricOverrides) : {} }; }),
    teacherReview: protectedProcedure.input(z.object({ writingId: z.number(), teacherNote: z.string().max(2000).optional(), rubricOverrides: z.record(z.string(), z.number().int().min(0).max(25)).default({}), issueStatuses: z.record(z.string(), z.enum(["pending", "resolved", "needs_teacher_review"])).default({}) })).mutation(async ({ ctx, input }) => { await requireRole(ctx, ['teacher', 'tutor', 'admin']); const saved = await getWritingEvaluation(input.writingId); if (!saved) throw new Error('學生尚未保存校對評估。'); const parsed = normalizeEvaluation(JSON.parse(saved.evaluationData), saved.level); const reviewed = { ...parsed, rubric: parsed.rubric.map((row) => ({ ...row, score: input.rubricOverrides[row.key] ?? row.score })), issues: parsed.issues.map((issue) => ({ ...issue, status: input.issueStatuses[issue.id] ?? issue.status })) }; await saveWritingEvaluation({ writingId: input.writingId, level: saved.level, evaluationData: JSON.stringify(reviewed), reflection: saved.reflection, teacherNote: input.teacherNote ?? saved.teacherNote, rubricOverrides: JSON.stringify(input.rubricOverrides), reviewedAt: new Date() }); return reviewed; }),
  }),
  teaching: router({ feedback: protectedProcedure.input(z.object({ writingId: z.number(), body: z.string().min(1).max(2000) })).mutation(async ({ ctx, input }) => { await requireRole(ctx, ['teacher', 'tutor', 'admin']); return addFeedback({ writingId: input.writingId, authorId: ctx.user.id, body: input.body }); }), listFeedback: protectedProcedure.input(z.object({ writingId: z.number() })).query(async ({ ctx, input }) => { await requireRole(ctx, ['student', 'teacher', 'tutor', 'admin']); return listFeedback(input.writingId); }) }),
  anthology: router({ list: protectedProcedure.query(async ({ ctx }) => { await requireRole(ctx, ['teacher', 'tutor', 'admin']); return listAnthologyItems(); }), exportContent: protectedProcedure.query(async ({ ctx }) => { await requireRole(ctx, ['teacher', 'tutor', 'admin']); const items = await listAnthologyItems(); return items.map((item, index) => ({ order: item.displayOrder ?? index + 1, authorCode: item.authorCode, title: item.publicationTitle ?? 'Untitled student work', approved: Boolean(item.approved) })); }), exportPdf: protectedProcedure.mutation(async ({ ctx }) => { await requireRole(ctx, ['teacher', 'tutor', 'admin']); const items = await getAnthologyPdfItems(); const pdf = await buildAnthologyPdf(items); const stored = await storagePut(`anthology/chung-sing-${Date.now()}.pdf`, pdf, 'application/pdf'); await createAnthologyExport({ createdBy: ctx.user.id, format: 'pdf', storageKey: stored.key, itemCount: items.length }); return { url: stored.url, count: items.length }; }), select: protectedProcedure.input(z.object({ writingId: z.number(), authorCode: z.string().max(32), publicationTitle: z.string().max(180).optional(), displayOrder: z.number().optional(), approved: z.number().min(0).max(1) })).mutation(async ({ ctx, input }) => { await requireRole(ctx, ['teacher', 'admin']); return selectAnthologyItem(input); }) }),
  accounts: router({
    bulkImport: protectedProcedure.input(z.object({ classCode: z.string().max(32), csv: z.string().max(12000) })).mutation(async ({ ctx, input }) => {
      await requireRole(ctx, ['teacher', 'tutor', 'admin']);
      const schoolClass = await getClassByCode(input.classCode);
      if (!schoolClass) throw new Error('找不到指定班別。');
      const rows = parseStudentCsv(input.csv, input.classCode);
      const batchId = await createImportBatch({ importedBy: ctx.user.id, classId: schoolClass.id, rowCount: rows.length, status: 'completed' });
      const credentials = [];
      for (const row of rows) {
        const initialCode = generateInitialCode();
        await createStudentAccount({ classId: schoolClass.id, schoolCode: row.schoolCode, username: row.username, initialCodeHash: hashInitialCode(initialCode), mustChangeCode: true, active: true });
        credentials.push({ schoolCode: row.schoolCode, username: row.username, initialCode });
      }
      return { batchId, credentials, warning: '初始碼只會在這次回應顯示一次，請教師下載並安全交給學生。' };
    }),
    teacherLogin: publicProcedure
      .input(z.object({ email: z.string().email().max(120), password: z.string().min(4).max(64) }))
      .mutation(async ({ ctx, input }) => {
        const email = normalizeTeacherEmail(input.email);
        const user = await getUserByEmail(email);
        if (!user || !verifyPasswordMd5(input.password, user.passwordHash)) {
          throw new Error('電郵或密碼不正確。');
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
        const email = normalizeTeacherEmail(input.email);
        const user = await getUserByEmail(email);
        if (!user || !verifyPasswordMd5(input.password, user.passwordHash)) {
          throw new Error('電郵或密碼不正確。');
        }
        if (user.role !== 'admin') {
          throw new Error('此帳戶不是管理員權限。');
        }
        await setSessionCookie(ctx.req, ctx.res, { openId: user.openId, name: user.name ?? 'Admin' });
        return { success: true as const };
      }),
    studentLogin: publicProcedure.input(z.object({ username: z.string().min(3).max(64), code: z.string().min(6).max(32) })).mutation(async ({ ctx, input }) => {
      const account = await (await import('./db')).getStudentAccountByUsername(input.username);
      if (!account || !account.active || !verifyInitialCode(input.code, account.initialCodeHash)) throw new Error('帳號或初始碼不正確。');
      const user = await (await import('./db')).createOrGetStudentUser(account.username);
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
  writingCoach: router({ evaluate: publicProcedure.input(z.object({ draft: z.string().max(6000), level: z.enum(["P5", "P6"]) })).mutation(async ({ input }) => { const response = await invokeLLM({ messages: [{ role: "system", content: safeWritingRules + "\nEvaluate only for " + input.level + ". Return Traditional Chinese JSON. Never rewrite the student's work. Use four rubric rows: ideasVoice, structure, language, revision; each score is 0-25 with an age-appropriate reason. Return at most eight issue cards. Each card must include a short fragment, category, explanation, and a hint that asks the student to decide or revise; never provide a complete replacement sentence. Rubric labels: Ideas & Creativity, Structure, Language, Revision Effort." }, { role: "user", content: "Student level: " + input.level + "\nDraft:\n" + sanitizeStudentText(input.draft) }], response_format: { type: "json_schema", json_schema: { name: "writing_evaluation_cards", strict: true, schema: { type: "object", properties: { level: { type: "string", enum: ["P5", "P6"] }, rubric: { type: "array", minItems: 4, maxItems: 4, items: { type: "object", properties: { key: { type: "string", enum: ["ideasVoice", "structure", "language", "revision"] }, label: { type: "string" }, score: { type: "integer", minimum: 0, maximum: 25 }, reason: { type: "string" } }, required: ["key", "label", "score", "reason"], additionalProperties: false } }, strengths: { type: "array", minItems: 1, maxItems: 3, items: { type: "string" } }, nextSteps: { type: "array", minItems: 1, maxItems: 3, items: { type: "string" } }, issues: { type: "array", maxItems: 8, items: { type: "object", properties: { id: { type: "string" }, category: { type: "string", enum: ["grammar", "word_choice", "punctuation", "structure", "clarity"] }, fragment: { type: "string" }, explanation: { type: "string" }, hint: { type: "string" } }, required: ["id", "category", "fragment", "explanation", "hint"], additionalProperties: false } } }, required: ["level", "rubric", "strengths", "nextSteps", "issues"], additionalProperties: false } } } }); const content = response.choices?.[0]?.message?.content; return parseEvaluationContent(content, input.level); }), suggest: publicProcedure.input(z.object({ mode: supportMode, draft: z.string().max(6000), level: z.enum(["P5", "P6"]) })).mutation(async ({ input }) => { const modeInstruction = { idea: "Give two or three guiding questions that help the student develop the next story idea. Do not provide plot paragraphs.", language: "Give up to five age-appropriate vocabulary options and explain when each may fit. Do not rewrite the student's sentences.", structure: "Point out one strength and ask two questions about beginning, problem, turning point, or ending. Do not create a plot for the student.", proofread: "Identify up to three proofreading areas to check, quoting only very short fragments if necessary. Explain the rule and let the student revise it themselves." }[input.mode]; const response = await invokeLLM({ messages: [{ role: "system", content: `${safeWritingRules}\n\nTask: ${modeInstruction}\nUse clear, encouraging language suitable for ${input.level}. Respond in Traditional Chinese, with English examples only when useful.` }, { role: "user", content: `Here is the student's draft. Treat it as private writing content and do not request identifying details:\n\n${sanitizeStudentText(input.draft)}` }] }); const content = response.choices?.[0]?.message?.content; return { suggestion: typeof content === "string" ? content : "請先寫下你想保留的句子，再選一個小地方修改。" }; }), ask: publicProcedure.input(z.object({ question: z.string().min(1).max(1000), level: z.enum(["P5", "P6"]), lang: z.enum(["zh", "en"]) })).mutation(async ({ input }) => { const languageRule = input.lang === "zh" ? "Respond in Traditional Chinese, with English examples only when useful." : "Respond in clear, simple English suitable for primary students."; const response = await invokeLLM({ messages: [{ role: "system", content: `${safeWritingRules}\n\nYou are answering one short question from a student about their own creative writing. Never write a complete story, paragraph, poem, essay or dialogue scene for them. In a few short sentences: ask one guiding question, offer 1-3 concrete directions or choices, and remind them the final sentences are theirs. ${languageRule} Suitable for ${input.level}.` }, { role: "user", content: `Student's question:\n${sanitizeStudentText(input.question)}` }] }); const content = response.choices?.[0]?.message?.content; return { answer: typeof content === "string" ? content : (input.lang === "zh" ? "請再講清楚少少你想問嘅部分，我會用問題引導你繼續。" : "Please tell me a little more about what you want to ask, and I will guide you with questions.") }; }) }),
});
export type AppRouter = typeof appRouter;
