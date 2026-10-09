# StorySeed

School writing platform for Chung Sing School P5 and P6. Students draft and revise their own work. The AI coach asks questions and points out choices. It does not write the piece for them. Teachers review proofreading, curate an anthology, and import student accounts.

The app is React 19, Vite, Express, tRPC, and Drizzle (MySQL). It is not a single HTML file.

## Run it

Requirements: Node.js 22 or newer, and pnpm 10.

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000/](http://localhost:3000/).

| URL | What it is |
| --- | --- |
| `/` | Demo studio. No login. Saves stay in the browser. |
| `/student-login` | Student username and one-time code |
| `/student` | Student studio: proofreading and the 15-lesson course |
| `/teacher-login` | Staff sign-in (OAuth) |
| `/teacher` | Teacher studio: overview, review, anthology, accounts |

Demo mode is enough to click through the screens. Live AI answers, real login, and saved work need a `.env` file. Copy the names from `LOCAL_ENV_TEMPLATE.txt`:

- `DATABASE_URL` — MySQL connection string
- `JWT_SECRET` — session secret, at least 32 characters
- `VITE_APP_ID` and `OAUTH_SERVER_URL` — teacher login
- `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY` — AI coach
- `OWNER_OPEN_ID` — admin account

Then create the tables and restart:

```bash
pnpm db:push
pnpm dev
```

Do not commit `.env` or share API keys.

Other commands: `pnpm check`, `pnpm test`, `pnpm build`, `pnpm start`.

Longer setup notes are in `LOCAL_SETUP.md`. Handoff notes for another developer are in `AI_HANDOFF.md`.

## What is already built

- Proofreading Studio with rubric rows, issue cards, student revisions, and a safe fallback when the model reply is unusable
- 15-lesson course in Traditional Chinese and English, with a writing task and an AI thinking-partner panel
- Teacher proofreading review (queue, score overrides, notes) once evaluations are in the database
- Anthology preview, reorder, CSV download, and an A4 PDF generator
- Student accounts: CSV import, hashed one-time codes, forced first-login code change
- Separate `/teacher` and `/student` portals

## Unfinished parts

These still use demo data, a missing provider, or a gap between the API and the screen.

1. **No local secrets in this checkout.** There is no `.env`. AI calls show an error, teacher OAuth cannot finish, and nothing is written to MySQL until those values are filled in. Until an evaluation returns, Proofreading Studio shows 60/100 from four placeholder rows of 15. A separate word-count `score` is calculated in `Home` and then ignored.

2. **Class Overview is sample numbers.** `TeacherOverviewView` always shows 20 P5 and 20 P6 students and the five sample titles. It does not read `curriculum.classes`, the review queue, or the anthology table.

3. **Anthology Studio edits an in-memory list.** The five pieces in `initialSubmissions` are not database rows. Approve and reorder change React state. The logged-in `anthology.exportContent` query is not what the cards display. PDF export needs a teacher session, approved writings, and file storage.

4. **PDF metadata is fixed.** `getAnthologyPdfItems` labels every approved piece as level P6 and category "Student Writing".

5. **No EPUB.** The shareable book is the same A4 PDF. `anthologyExports.format` only allows `pdf` and `csv`.

6. **P5 and P6 share one course.** The level buttons change the badge and the level sent to the coach. Lesson titles and activities do not change.

7. **Lessons are not loaded from MySQL.** The `assignments` table and `curriculum.assignments` API exist. The course screen reads the arrays in `client/src/pages/Home.tsx` instead.

8. **No way to create a class in the UI.** Account import looks up a class code and fails with "找不到指定班別" if that row is missing. `curriculum.bindMember` is admin-only and has no screen. There is no seed script.

9. **Demo saves do not survive a refresh.** Lesson pieces (`journeyOutputs`) and the proofreading draft live in component state. Database save runs only when a student session exists.

10. **Lesson checklist resets** when the student leaves that lesson. Ticks are not stored.

11. **Header mark is always "07".** It is not the signed-in school code.

12. **Hosting outside Manus is not wired.** OAuth, the Forge LLM, and storage still use the Manus environment variables. See `hostinger-compatibility-audit.md`.

13. **Database integration tests are not written.** Vitest covers privacy redaction, role helpers, evaluation parsing, login redirects, and PDF font resolution. It does not run against a disposable MySQL database.

14. **No school-wide backup or admin export** beyond the anthology CSV and PDF.

Search the source for `UNFINISHED` to jump to these notes in the files.
