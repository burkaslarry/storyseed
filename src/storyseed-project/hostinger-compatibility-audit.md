# StorySeed Hostinger Compatibility Audit

## Current project facts

StorySeed is a React 19 + Vite frontend with an Express 4 / tRPC 11 backend, Drizzle ORM with MySQL/TiDB, Manus OAuth, Manus built-in LLM/storage APIs, and server-side PDF generation with `pdf-lib` and `fontkit`. The production scripts are `vite build && esbuild server/_core/index.ts ... --outdir dist` and `NODE_ENV=production node dist/index.js`. The server reads `PORT`, serves the Vite output in production, and exposes `/api/trpc` and `/api/oauth/callback`.

## Hostinger official findings

1. Hostinger's official Node.js web app documentation states that Business Web Hosting and Cloud plans support Node.js applications, with React, Vite and Express listed as supported frontend/backend technologies. It lists Node.js 18.x, 20.x, 22.x and 24.x as supported versions. Source: https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/

2. Hostinger's official hosting-options page distinguishes managed Business/Cloud Node.js web apps from VPS deployment and static frontend hosting. Source: https://www.hostinger.com/support/node-js-hosting-options-at-hostinger/

3. Hostinger's official launch article states that managed Node.js web application hosting is available on Business Web Hosting and Cloud plans, while VPS requires manual configuration. Source: https://www.hostinger.com/blog/nodejs-hosting-launch/

## Compatibility assessment

The React/Vite frontend, Express backend, Node.js start script, dynamic `PORT` usage, and MySQL-compatible Drizzle layer are broadly portable to Hostinger Business/Cloud Node.js hosting or a VPS. Manus OAuth, Manus built-in LLM APIs, Manus storage, storage proxy assumptions, and pre-injected environment variables are not portable by themselves; they require replacement credentials, a Hostinger-compatible OAuth provider or school identity system, an external LLM provider, and S3-compatible storage.

The project should not be presented as "Hostinger-ready" until a deployment adapter is added for authentication, AI, file storage, environment validation, and database migrations. The safest architecture is a provider interface with Manus adapters retained for the current deployment and Hostinger adapters added separately.

## AI Creative Writing priorities

The product should emphasize student agency: teacher-authored lesson objectives, prompt cards, idea branching, outline checkpoints, evidence of revision, explain-before-suggest AI feedback, age-level rubric calibration, teacher override, and anthology provenance. AI should never silently rewrite complete student work.
