import type { Request, Response, NextFunction } from "express";

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

/** Block cross-site POSTs that carry session cookies (SameSite=None). */
export function csrfOriginGuard(req: Request, res: Response, next: NextFunction) {
  if (SAFE.has(req.method)) {
    next();
    return;
  }
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (!origin || !host) {
    next();
    return;
  }
  try {
    const originHost = new URL(origin).host;
    if (originHost === host) {
      next();
      return;
    }
  } catch {
    res.status(403).send("Forbidden");
    return;
  }
  res.status(403).send("Forbidden");
}
