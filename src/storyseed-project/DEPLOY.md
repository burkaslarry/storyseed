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

Drill teacher: `teacher-drill@chungsing.edu.hk` / `DrillTeacher01` · student: `student-p6-drill` / `DRILLCODE01` (passwords stored as MD5 in Postgres).

## Database

Render Postgres only — do not deploy the web app on Render unless you intentionally want a second host.
