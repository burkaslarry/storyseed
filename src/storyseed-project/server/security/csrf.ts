import type { Request, Response, NextFunction } from "express";
import { COOKIE_NAME } from "@shared/const";

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Reject cookie-authenticated mutations that do not come from this origin.
 * Bearer-token clients (no ambient cookie) are not vulnerable to CSRF and are
 * left alone, as are logins, which run before a session cookie exists.
 */
export function csrfOriginGuard(req: Request, res: Response, next: NextFunction) {
  if (SAFE.has(req.method) || req.headers.authorization) {
    next();
    return;
  }
  const hasSessionCookie = (req.headers.cookie ?? "")
    .split(";")
    .some((pair) => pair.trim().startsWith(`${COOKIE_NAME}=`));
  if (!hasSessionCookie) {
    next();
    return;
  }
  const source = req.headers.origin ?? req.headers.referer;
  if (!source) {
    res.status(403).send("Forbidden");
    return;
  }
  try {
    if (new URL(source).host === req.headers.host) {
      next();
      return;
    }
  } catch {
    res.status(403).send("Forbidden");
    return;
  }
  res.status(403).send("Forbidden");
}
