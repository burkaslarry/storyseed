/*
 * Process environment used by auth, database, and DeepSeek writing coach.
 * Writing coach uses DEEPSEEK_* only — do not rely on BUILT_IN_FORGE_*.
 */
export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  /** DeepSeek OpenAI-compatible API (writingCoach). */
  deepseekApiUrl: (process.env.DEEPSEEK_API_URL ?? "https://api.deepseek.com").trim(),
  deepseekApiKey: (process.env.DEEPSEEK_API_KEY ?? "").trim(),
  deepseekModel: (process.env.DEEPSEEK_MODEL ?? "deepseek-chat").trim() || "deepseek-chat",
  /**
   * Bump on Hostinger (or change the default) to invalidate every lab JWT on
   * shared computer-room PCs. Empty disables the check.
   */
  sessionEpoch: (process.env.SESSION_EPOCH ?? "2026-11-26-lab").trim(),
  /** Leftover Manus helpers only — not used by writingCoach. */
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
