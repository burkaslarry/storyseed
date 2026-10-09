import type { Request, Response } from "express";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";

export function sessionAppId() {
  return ENV.appId || "storyseed";
}

export async function setSessionCookie(
  req: Request,
  res: Response,
  input: { openId: string; name: string }
) {
  if (!ENV.cookieSecret) {
    throw new Error("伺服器未設定 JWT_SECRET，無法建立登入工作階段。");
  }
  const token = await sdk.signSession({
    openId: input.openId,
    appId: sessionAppId(),
    name: input.name,
  });
  res.cookie(COOKIE_NAME, token, {
    ...getSessionCookieOptions(req),
    maxAge: 1000 * 60 * 60 * 12,
  });
}
