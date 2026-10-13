import express, { type Express } from "express";
import fs from "node:fs";
import path from "node:path";

/* [F010][S020] Serve the built client from the long-running Hostinger server.
 * Input: dist/server/index.js and sibling dist/public assets.
 * Process: Resolve public relative to the bundle; serve SPA routes without masking API errors.
 * Output: HTML/assets for the client and JSON 404 for unknown API routes.
 */
export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "../public");
  if (!fs.existsSync(path.join(distPath, "index.html"))) {
    throw new Error(`Client build missing: ${distPath}`);
  }
  app.use("/api", (_req, res) => { res.status(404).json({ error: "API route not found" }); });
  app.use(express.static(distPath));
  app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
}
