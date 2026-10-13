# StorySeed on Hostinger

## [F010][S020] Run the complete app as an Express Node.js application

Use managed Node.js hosting or an existing VPS. Static-only hosting cannot run login, tRPC, database access or PDF generation.

| Setting | Value |
| --- | --- |
| Repository root | `src/storyseed-project` |
| Framework | Express / Node.js backend |
| Node version | 22 or newer |
| Package manager | pnpm 10 as pinned in package.json |
| Install | `pnpm install --frozen-lockfile` |
| Build | `pnpm build:hostinger` |
| Entry file | `hostinger.cjs` |
| Start | `pnpm start` |
| Client assets | `dist/public`, served by Express |
| Health | `/healthz` |

The process binds 0.0.0.0 on the injected PORT, without switching ports in production. The client directory resolves relative to the server bundle. Unknown API paths return JSON 404; SPA paths serve index.html.

Hostinger currently invokes `pnpm run build` for Express. The default build also creates the server bundle. `hostinger.cjs` is a CommonJS-compatible launcher which dynamically imports that ESM bundle and logs startup failures.

## [F001][S001] Configure runtime secrets

Set in hPanel: NODE_ENV=production, the existing Render External PostgreSQL DATABASE_URL, PGSSL=true, PGSSLMODE=require and JWT_SECRET. Configure BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY for AI. PDF storage still needs the existing storage provider credentials.

Continue using Render DB dpg-d6iok5q4d50c738643c0-a. The handover's MySQL/OAuth descriptions refer to an older app; keep current Postgres and email/password login. Keep secrets out of Git and deployment archives. Hostinger deployment does not require changing the existing Vercel project or its domains.

## [F005][S019] Curriculum release

Merged the 2026-10-12 curriculum: five units of three lessons, formal essays in 3/6/9/12/15, different P5/P6 suggested titles, guided tasks, six-step writing, and editable proofreading titles. Existing student/teacher/admin login, management and persistence remain.

Titles await school confirmation. tools/curriculum_data.py is the supplied bilingual source. tools/apply_curriculum.py is a portable data-only updater and is not run during deployment.

## [F010][S018] Verify before handover

1. Homepage and all student/teacher/admin login paths serve HTML.
2. /healthz returns ok: true; /api/trpc/system.dbPing separately verifies DB access.
3. Unknown /api paths return JSON 404, not the SPA.
4. Sign in and save a titled essay; confirm body/title belong to the selected lesson.
5. Check both levels/languages, unit badges and six stages.
6. Verify management, AI planning and PDF storage separately.

Local build success does not prove a Hostinger deployment. Record the hPanel deployment result and live URL after deployment.
