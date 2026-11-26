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
| Health | `/healthz` (includes Postgres ping; 503 if DB is down) |

The process binds 0.0.0.0 on the injected PORT, without switching ports in production. The client directory resolves relative to the server bundle. Unknown API paths return JSON 404; SPA paths serve index.html.

Hostinger currently invokes `pnpm run build` for Express. The default build also creates the server bundle. `hostinger.cjs` is a CommonJS-compatible launcher which dynamically imports that ESM bundle and logs startup failures.

## [F001][S001] Configure runtime secrets

Set in hPanel: NODE_ENV=production, the existing Render External PostgreSQL DATABASE_URL, PGSSL=true, PGSSLMODE=require and JWT_SECRET.

Writing coach uses **DeepSeek only** (not Forge):

| Variable | Effect |
| --- | --- |
| `DEEPSEEK_API_KEY` | Required for 問 AI / writingCoach |
| `DEEPSEEK_API_URL` | Optional; default `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | Optional; default `deepseek-chat` |
| `COACH_GLOBAL_MAX` | Optional; default `6` simultaneous AI calls |

Do **not** set `BUILT_IN_FORGE_API_URL` / `BUILT_IN_FORGE_API_KEY` for the coach.

Classroom-safe PDF flag (defaults **on** when unset):

| Variable | Effect |
| --- | --- |
| `BLOCK_ANTHOLOGY_PDF` unset / `true` | Block anthology PDF export (classroom default) |
| `BLOCK_ANTHOLOGY_PDF=false` | Allow PDF export (use after class only) |

In Hostinger hPanel → Node.js app → Environment variables, set:

```text
BLOCK_ANTHOLOGY_PDF=true
DEEPSEEK_API_KEY=<your DeepSeek key>
```

(or leave `BLOCK_ANTHOLOGY_PDF` unset after this release — code defaults to blocked).

Continue using Render DB dpg-d6iok5q4d50c738643c0-a. The handover's MySQL/OAuth descriptions refer to an older app; keep current Postgres and email/password login. Keep secrets out of Git and deployment archives. Hostinger deployment does not require changing the existing Vercel project or its domains.

## [F005][S019] Curriculum release

Merged the 2026-10-12 curriculum: five units of three lessons, formal essays in 3/6/9/12/15, different P5/P6 suggested titles, guided tasks, six-step writing, and editable proofreading titles. Existing student/teacher/admin login, management and persistence remain.

Titles await school confirmation. tools/curriculum_data.py is the supplied bilingual source. tools/apply_curriculum.py is a portable data-only updater and is not run during deployment.

## [F010][S018] Verify before handover

1. Homepage and all student/teacher/admin login paths serve HTML.
2. /healthz returns ok: true only when Postgres is reachable (503 otherwise).
3. Unknown /api paths return JSON 404, not the SPA.
4. Sign in and save a titled essay; confirm body/title belong to the selected lesson.
5. Check both levels/languages, unit badges and six stages.
6. Verify management and PDF export separately. AI coach is disabled.

Local build success does not prove a Hostinger deployment. Record the hPanel deployment result and live URL after deployment.
