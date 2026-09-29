# StorySeed AI Handoff Package

## 1. Project identity

**Project:** StorySeed — Chung Sing School AI Creative Writing Platform

**Purpose:** A school-based AI creative-writing platform for P5/P6 students. The AI acts as a writing coach, not a ghostwriter. Students move through ideation, outlining, drafting, revision and submission, while teachers review progress and curate an anthology.

**School context:** Chung Sing School; two classes, approximately 20 P5 and 20 P6 students; 15 lessons across two terms; final deliverables include substantive editing, visual anthology design, print-ready PDF and shareable e-book output.

## 2. Technology stack

- React 19 + Vite
- TypeScript
- Express 4
- tRPC 11
- Drizzle ORM
- MySQL/TiDB database
- pdf-lib + fontkit for server-side anthology PDF generation
- Vitest tests
- Tailwind CSS and shadcn-style UI components
- Current Manus adapters for OAuth, built-in LLM and storage

The project is **not a single static HTML file**. It is a full-stack application. The frontend can be previewed locally without complete credentials, but AI, authentication and persistent data require environment configuration.

## 3. Main user-facing areas

### Student portal

- `/student-login`: separate student login entry point
- `/student`: student writing workspace
- Proofreading Studio: AI rubric, issue cards, hints, student revision fields and reflection
- 15-Lesson Course: P5/P6 activities and Writer’s Journey collectible outputs
- Five-stage writing workflow: idea, outline, draft, revision and submitted
- Draft/version persistence when a database is configured
- Student username, one-time initial code and forced first-login code change

### Teacher portal

- `/teacher-login`: separate teacher login entry point
- `/teacher`: teacher workspace
- Proofreading Review: queue of saved student evaluations, rubric score overrides, issue-card status and teacher notes
- Anthology Studio: submission review, title, author code, category, editorial notes, student confirmation, approval, ordering and export
- Account Desk: CSV student import, username generation and one-time initial codes

## 4. Important source files

- `client/src/pages/Home.tsx`: main student/teacher studio UI, header branding, Proofreading, Writer’s Journey, Anthology and Account Desk views
- `client/src/App.tsx`: routes for `/`, `/teacher-login`, `/student-login`, `/teacher` and `/student`
- `server/routers.ts`: tRPC API procedures, role guards, writing persistence, evaluation save/get/queue/review, account and anthology procedures
- `server/db.ts`: database helpers
- `server/writingEvaluation.ts`: structured rubric and issue-card schema, normalization and safe fallback
- `server/writingEvaluation.test.ts`: rubric, issue-card, fallback and student revision tests
- `server/accountProvisioning.ts`: CSV parsing, initial-code generation and hashing
- `server/anthologyPdf.ts`: A4 branded anthology PDF generation
- `drizzle/schema.ts`: MySQL schema
- `drizzle/0003_steady_ironclad.sql`: `writingEvaluations` migration
- `todo.md`: implementation checklist and completed work
- `hostinger-compatibility-audit.md`: deployment portability assessment
- `LOCAL_SETUP.md`: local setup instructions
- `LOCAL_ENV_TEMPLATE.txt`: safe environment variable name template

## 5. Database additions

The current schema contains users, classes, class members, student accounts, assignments, writings, writing versions, feedback, anthology items/exports and:

`writingEvaluations`

- `writingId`: unique writing reference
- `level`: P5 or P6
- `evaluationData`: normalized evaluation JSON including rubric and issue cards
- `reflection`: student reflection
- `teacherNote`: teacher review note
- `rubricOverrides`: teacher score overrides JSON
- `reviewedAt`, `createdAt`, `updatedAt`

The migration file is included. Run `pnpm db:push` only after a local MySQL database and `DATABASE_URL` have been configured.

## 6. AI safety and teaching design

The platform must preserve student agency:

- Do not generate complete student essays.
- Give questions, hints, explanations, vocabulary directions and structure suggestions.
- Show the original fragment and ask the student to make the final revision.
- Keep P5 and P6 rubric language age-appropriate.
- Redact obvious email addresses and Hong Kong phone numbers before AI calls.
- Preserve draft versions and revision evidence.
- Teacher overrides are separate from AI suggestions.

If changing AI prompts or evaluation schemas, update the parser fallback and Vitest tests in `server/writingEvaluation.test.ts`.

## 7. Branding asset

The current header uses the supplied transparent logo for **榮邦教育 / Advanced Comet Education Limited**. In the Manus-hosted version the header references:

`/manus-storage/logo_with_black_charity_info_trimmed_d78c6bc3.png`

The original supplied logo is included separately in the handoff package under `storyseed-assets/logo_with_black_charity_info.png`. **Localised on 2026-09-28:** the logo was copied to `client/public/logo_with_black_charity_info.png` and `Home.tsx` now references `/logo_with_black_charity_info.png` (no Manus-storage dependency). Verified via browser: image loads with naturalWidth 661 on `/?studio=course`.

## 8. Local development

Requirements: Node.js 22+, pnpm 10 and, for full functionality, MySQL/TiDB.

```bash
pnpm install
pnpm dev
```

Then open `http://localhost:3000/`.

For a full local configuration, create `.env` using `LOCAL_ENV_TEMPLATE.txt`, fill in database/auth/LLM settings, then run:

```bash
pnpm db:push
pnpm check
pnpm test
pnpm build
pnpm start
```

Never include `.env`, API keys, OAuth secrets or database passwords in the handoff package.

## 9. Current validation

The latest verified state passed:

- `pnpm check`
- `pnpm test`: 15 tests passed
- `pnpm build`
- `git diff --check`
- Desktop and mobile visual checks for student Proofreading/Course views
- Desktop visual check for teacher Proofreading Review

## 9a. Windows portability fixes (2026-09-28)

The package was taken over on a Windows host and three portability gaps were fixed:

1. **Build scripts** — pnpm 10 blocks postinstall scripts by default; `onlyBuiltDependencies` now allows `esbuild` and `@tailwindcss/oxide` (`package.json` → `pnpm.onlyBuiltDependencies`).
2. **Anthology PDF fonts** — `server/anthologyPdf.ts` hard-coded Linux Noto font paths. It now resolves CJK fonts through `resolveCjkFontPath()`: `NOTO_CJK_REGULAR_PATH` / `NOTO_CJK_BOLD_PATH` env override → bundled `fonts/NotoSansCJKtc-{Regular,Bold}.otf` (included in the repo) → Linux system path. Added a Vitest regression test.
3. **Dev/start scripts** — Unix-style `NODE_ENV=...` prefixes and `tsx watch` hang on Windows. Scripts now use `cross-env` and Node 22 native `node --watch --import tsx`.

Verified locally: `pnpm install` → `pnpm check` → `pnpm test` (15/15) → `pnpm build` → `pnpm dev` serves http://localhost:3000/ (HTTP 200, app title loads).

## 9b. Lesson 02 curriculum deepening (2026-09-28)

Uploaded real business documents (school quotation + Lesson 2 student notes) and used them to deepen the platform course:

1. **Alignment check** — The platform's 15 lesson titles/outputs already match the quotation's 15-lesson outline (Prompting for Ideas ↔ 「把靈感變成故事種子／三個故事種子」etc.). The real gap was generic demo copy vs. actual lesson structure; `quotation-review.md` recommended writing each lesson's platform activity and savable output into the course.
2. **Lesson 02 activity** — `client/src/pages/Home.tsx` now carries a `lessonActivities` map (typed `LessonActivity`) plus a `LessonActivityPanel` component rendered inside `CourseView` when the selected lesson has structured content. Lesson 2's panel is built from the real student notes: learning goals, big idea (「AI 是思考夥伴，不是作者」), Part A prompt formula (Role/Task/Genre/Character/Setting/Twist + example), Part B responsible-AI rules, Part C guided practice steps, Part D compare-three-ideas, Part E make-it-your-own, Part F story-seed plan, interactive quick checklist (badge counts done/total), and Exit Ticket prompts. The existing textarea remains the workspace where students write their prompt, three ideas and story seed plan, then save as the lesson output.
3. Other lessons keep their existing content for now; the map makes it easy to add structured activities later (same pattern, keyed by lesson number).

Verified locally: `pnpm check` ✓, `pnpm test` 15/15 ✓, `pnpm build` ✓, browser page-text check of `/?studio=course` confirms Lesson 02 shows the full activity panel and the checklist toggle works (0/5 → 1/5).

## 9c. All 15 lessons deepened (2026-09-28)

Extended the Lesson 02 pattern to the whole 15-lesson course, still aligned with the quotation outline and the real student-notes format:

1. **Generic lesson structure** — `LessonActivity` was re-typed around an enumerable `LessonPart` (`title` + `kind: pairs | list | text | plan` with `pairs?/items?/text?`), so each lesson can mix formula tables, rule/step lists, writing tasks, and fill-in plan chips. `LessonActivityPanel` now renders parts generically; the interactive quick checklist (badge done/total) and Exit Ticket prompts remain for every lesson.
2. **15/15 lessons covered** — `lessonActivities` now has entries for lessons 1–15, each with learning goals, big idea, activity parts mapped to the quotation's key focus (intro & safety rules, prompting ideas, character, sensory setting, story structure, dialogue, first draft, revision, poetry/image writing, AI editing partner, expanding scenes, genre experiment, publication prep, peer sharing & final refinement, showcase & reflection), checklist and exit ticket. All content follows the platform principles: AI is a thinking partner (never ghostwrites), school code names only, and every output stays the student's original voice.
3. Lesson 2 was re-expressed in the same generic structure; content unchanged.

Verified locally: `pnpm check` ✓, `pnpm test` 15/15 ✓, `pnpm build` ✓, browser page-text spot-checks of lessons 1, 2, 12 and 15 on `/?studio=course` all render their activity panels (goals, big idea, parts, checklist, exit ticket).

## 9d. Student notes DOCX for lessons 1, 3–15 (2026-09-28)

Produced 14 English student-notes Word files (Lessons 1, 3–15) replicating the layout of the school's real Lesson 2 notes (user template, unchanged): A4, Calibri, D7DBE2 thin borders, E8EEF5 header shading, FFF8E8 / F8FAFC info boxes, underline answer lines, `[ ]` checklist and 3-box exit ticket. Content maps each lesson to the quotation's Key Focus / Student Output and reuses the same activities as the platform (consistency between classroom notes and the platform).

- Deliverables: `C:\Users\Hong\Doubao\chats\2026-09-28\new-chat\鐘聲學校_AI創意寫作_學生筆記\AI_Creative_Writing_Student_Notes_Lesson_{1,3..15}.docx`
- Generator + outline: `...\new-chat\lesson_notes_work\gen_student_notes.py` / `outline.md` / `attachment_purpose.md`
- Verified: `audit.py audit` exit 0 for all 14 files, `catalogue.py` no-op (no TOC), `read.py -d 0` spot-checked Lessons 1/12/15 against the template skeleton.

## 9e. Full bilingual UI + course content (2026-09-28)

User requested 中英翻譯 for the whole platform. Implemented a 繁中↔English toggle covering both the interface and all 15 lessons' content:

1. **Language state** — `Home.tsx` now has `const [lang, setLang] = useState<Lang>("zh")` (`type Lang = "zh" | "en"`). The Header right side shows a toggle button (`EN` / `繁中`, `aria-label="Switch language"`); `lang` is threaded into every view via props.
2. **Course data** — `lessons` became `Record<Lang, readonly [title, description, output][]>` with full English translations of all 15 lesson titles/descriptions/output labels. `lessonActivities` split into `lessonActivitiesZh` (original) and `lessonActivitiesEn` (new English versions of every lesson's goals, big idea, parts, checklist and exit ticket, aligned with the English student notes), merged as `Record<Lang, Record<number, LessonActivity>>`.
3. **UI copy** — a `ui: Record<Lang, Record<string,string>>` dictionary plus `t(lang, key, vars)` helper covers header nav, hero, studio cards, Proofreading/Review/Course/Anthology/Account views, buttons, badges and placeholders. Rubric row labels map via `rubricLabelText(lang, label)`; anthology submission statuses render via `statusText(lang, status)` — **stored Chinese values unchanged** so existing logic (`status === "已核准"` etc.) still works. Dynamic coach/save feedback messages are also bilingual.
4. English lesson activity content deliberately mirrors the English student-notes DOCX wording so the platform and classroom notes stay consistent.

Verified locally: `pnpm check` ✓, `pnpm test` 15/15 ✓, `pnpm build` ✓, and browser checks on `/?studio=course` confirm both languages render fully for Lesson 1 (activity panel, learning goals, checklist, Exit Ticket, stage buttons, collectible-output label) with no Chinese residue in EN mode and no English label residue in ZH mode.

## 9f. Per-lesson writing task + AI interaction in Course view (2026-09-28)

User feedback: the stage buttons were explained, but the Course view never told students **what to write**, and AI was invisible outside Proofreading. Implemented both:

1. **Writing task card** — `LessonActivity` gained two fields: `writingTask` (this lesson's concrete writing instruction, e.g. "寫一段 5–8 分鐘嘅迷你作品…") and `aiStarter` (this lesson's sample AI question). All 15 lessons × zh/en got their own pair (30 blocks, inserted right after each `bigIdea`). The Course view now shows a highlighted "本堂寫作任務 / This lesson's writing task" card at the top of the collectible-output box, so students always know exactly what to produce and save.
2. **AI thinking-partner panel** — new `writingCoach.ask` publicProcedure in `server/routers.ts`: input `{ question (1–1000), level: "P5"|"P6", lang: "zh"|"en" }` → `{ answer }`. It reuses `safeWritingRules` (never writes complete passages; only guiding questions + 1–3 directions + reminder that the final sentences are the student's), sanitizes with `sanitizeStudentText`, and answers in the requested language. The Course view adds an "AI 思考夥伴 / AI thinking partner" panel under the textarea: one-click "用本堂提示問題 / Use this lesson's starter" fills the input with that lesson's `aiStarter`, an "問 AI / Ask AI" button calls the endpoint, and replies/errors render below with a standing reminder that AI points directions and the student writes the final sentences.
3. **Bilingual** — task card, AI panel, starter button and reminder are all localised; the `ui` dictionary gained 7 keys per language.

Verified locally: `pnpm check` ✓, `pnpm test` 15/15 ✓, `pnpm build` ✓, and browser checks on `/?studio=course`: ZH and EN both show the task card and AI panel for Lesson 1; the starter button fills the input with that lesson's aiStarter (Lesson 1 ZH + Lesson 2 EN verified); Ask AI calls the endpoint and shows the graceful bilingual error (the demo env has no LLM key — set the LLM key at deployment for live answers).

## 9g. Proofreading piece picker (2026-09-28)

User asked why the Proofreading Studio topic was fixed ("The Door in the Garden"). Cause: the demo mode has no database (`writingId` is null), so a hard-coded sample draft was used. Improved so students can proofread their own saved work:

- `ProofreadingView` now receives `journeyOutputs` and shows a piece picker (select) above the draft title. Options: each saved lesson piece from the Course view ("課堂收藏 · 第 {n} 課" / "Lesson {n} saved piece") plus the demo piece ("示範文章" / "Demo piece").
- Selecting a saved piece loads its text into the draft and sets the title to that lesson's name; selecting the demo restores `defaultDraft` and "The Door in the Garden".
- `ProofreadingView` signature typed as `{ lang }: { lang: Lang } & Record<string, any>` (avoids TS7053 on `lessons[lang]` indexing, same pattern as `CourseView`).

Verified locally: `pnpm check` ✓, `pnpm test` 15/15 ✓, `pnpm build` ✓; browser SPA-switch flow (save Lesson 1 in Course → switch to Proofreading via aside → picker shows "課堂收藏 · 第 1 課" and "示範文章") and both selections update draft content and title correctly.

## 9h. Teacher Class Overview panel (2026-09-28)

User asked whether the platform has separate student and teacher versions (it does: `/student` → student portal with Proofreading Studio + 15-Lesson Course only; `/teacher` → teacher portal with Proofreading Review, Anthology Studio, Account Desk + Course) and wanted teachers to see at a glance how many students and pieces exist. Added:

- New `overview` studio (`TeacherOverviewView`): stat cards (total students / pieces / awaiting review / approved), a class breakdown table (class code, students, pieces, pending, approved) and a recent-submissions list (from `initialSubmissions` demo data).
- Teacher mode now defaults to `overview` on login (`mode === "teacher" ? "overview" : ...`); entries added to the header nav (總覽 / Overview) and the aside list, filtered out for student mode. `Studio` type extended.
- All copy bilingual; the panel carries an explicit note that figures are demo data until the database is connected (then replace with `curriculum.classes` + `writingEvaluation.queue` + anthology lists).

Verified locally: `pnpm check` ✓, `pnpm test` 15/15 ✓, `pnpm build` ✓; browser checks on `/?studio=overview` in ZH and EN show the heading, four stat cards (40 / 5 / 3 / 1), the P5/P6 breakdown table and recent submissions; header and aside entries render.

## 9i. Course aligned to the user's own 15 student notes (2026-09-28)

User produced their own English student notes for Lessons 1-15 (DOCX) and asked the platform to be checked against and amended to fit them. The notes are now the authoritative source for the course content:

1. **Source of truth** - all 15 `Chung_Sing_AI_Creative_Writing_Lesson_{1..15}_Student_Notes.docx` were fully extracted (word `read.py -d 0`) and read end-to-end. Every lesson shares the same skeleton: 4 learning goals -> Big Idea box -> Parts A-R -> Exit Ticket -> writer's promise -> Quick Checklist; each part is a pairs table, rule list, fill-in plan, model text or writing task.
2. **Data rewrite** - `Home.tsx`'s `lessonActivitiesZh` and `lessonActivitiesEn` were fully replaced for lessons 1-15: English sides mirror the notes' wording (condensed), the Traditional-Chinese sides are the corresponding translations, and each lesson's `writingTask`/`aiStarter` were re-derived from the notes' actual writing prompts (e.g. L1 baseline mini-scene "When I opened the classroom door...", L6 120-160-word dialogue scene, L9 8-12-line image poem + image prose, L12 genre draft, L13 60-100-word author's note, L14 final manuscript, L15 showcase reflection). The generic `LessonPart` renderer (pairs/list/text/plan) carries all note structures without UI changes.
3. **Verified** - `pnpm check` OK, `pnpm test` 15/15 OK, `pnpm build` OK; browser page-text checks on `/?studio=course`: ZH lessons 1, 6, 12, 15 and EN lessons 1, 6, 15 all render their note-derived goals/big idea/parts/checklist/exit ticket, with the language toggle working both ways.
4. **No DB impact** - SQL is not connected yet; the user said content changes should be finished before the database is wired up. The writing-task card, AI thinking-partner panel, piece picker and teacher overview all continue to read from the same data structures.

## 10. Known portability limits

The current project works in the Manus WebDev environment. The React/Vite/Express/MySQL core is portable, but these adapters are Manus-specific and need replacement for independent deployment:

1. OAuth/session provider
2. Built-in LLM endpoint and API key
3. Manus storage URL and storage helpers
4. Environment injection and deployment configuration
5. Production database migration/backup process

For Hostinger, implement provider interfaces for auth, LLM and storage, use Hostinger Business/Cloud Node.js hosting or a VPS, configure a MySQL-compatible database, add HTTPS, and validate `PORT` plus all environment variables at startup.

## 11. Recommended next work

1. Add provider interfaces and non-Manus adapters for auth, LLM and S3-compatible storage.
2. Replace demo anthology data with fully database-backed teacher queue queries.
3. Add EPUB output if the school specifically requires a true e-book format rather than a shareable PDF.
4. Add database integration tests with a disposable MySQL database.
5. Add automated backup and school-admin data export procedures.

## 12. Prompt to give another AI

> You are taking over the StorySeed project in this folder. Read `AI_HANDOFF.md`, `LOCAL_SETUP.md`, `hostinger-compatibility-audit.md`, `todo.md`, `package.json`, `client/src/pages/Home.tsx`, `server/routers.ts`, `server/db.ts`, `server/writingEvaluation.ts` and `drizzle/schema.ts` before changing anything. Preserve the core principle that AI supports student writing and must not ghostwrite complete essays. Do not remove role guards, privacy redaction, first-login code change protection, rubric fallback, version history or anthology provenance. First run `pnpm check`, `pnpm test` and `pnpm build` to establish a baseline. Make changes in small phases, update database schema through Drizzle migrations, add tests for new behavior, and visually verify desktop and mobile layouts before delivery. Never expose or invent secrets. If deploying outside Manus, replace Manus OAuth, built-in LLM and storage through provider interfaces rather than hard-coding Manus URLs.
