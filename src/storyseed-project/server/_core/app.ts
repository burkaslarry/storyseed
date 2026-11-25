/*
 * Shared Express app for local server and Vercel serverless.
 */
import express, { type Express } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { csrfOriginGuard } from "../security/csrf";
import { checkDatabaseHealth } from "../db";

export function createApp(): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
  });
  /*
   * Hostinger probes /healthz. Include a Postgres ping so a wedged DB does not
   * look "healthy" while the whole class gets fake logins / hung saves.
   */
  app.get("/healthz", async (_req, res) => {
    const db = await checkDatabaseHealth();
    if (!db.ok) {
      res.status(503).json({ ok: false, database: db });
      return;
    }
    res.json({ ok: true, database: db });
  });
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));
  app.use(csrfOriginGuard);
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  return app;
}
