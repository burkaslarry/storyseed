# StorySeed deploy (Vercel)

## Vercel project root

In [Vercel → Project Settings → General → Root Directory](https://vercel.com/docs/deployments/configure-a-build#root-directory), set:

```text
src/storyseed-project
```

All paths in `vercel.json` are relative to **this folder** (not the git repo root).

## Build

- **Install:** `pnpm install`
- **Build:** `pnpm build` → handler in `dist/server/vercel-handler.js`, thin `api/index.js` re-exports it
- **Output:** `dist/public` only (no server JS at site root)

## Environment

Set on Vercel (Production + Preview): `DATABASE_URL`, `PGSSL=true`, `PGSSLMODE=require`, **`JWT_SECRET`** (required for teacher/student login cookies), plus auth/LLM vars from `.env.example`.

Drill accounts (MD5 in Postgres):

| Role | Login URL | Email / username | Password / code |
|------|-----------|------------------|-----------------|
| Teacher | `/teacher-login` | `teacher-drill@chungsing.edu.hk` | `DrillTeacher01` |
| Admin | `/admin-login` | `admin@chungsing.edu.hk` | `AdminStorySeed01` |
| Student | `/student-login` | `student-p6-drill` | `DRILLCODE01` |

Teacher: **帳號** (single + CSV import/export), **寫作任務** (create + publish to class). Admin: `/admin` student list + teacher CRUD.

## Database

Render Postgres only — do not deploy the web app on Render unless you intentionally want a second host.
