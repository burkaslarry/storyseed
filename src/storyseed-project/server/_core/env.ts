/*
 * Process environment used by auth and the database.
 * Classroom trial does not use the Forge LLM — writingCoach is disabled and
 * BUILT_IN_FORGE_* is optional (only needed by leftover Manus storage helpers).
 */
export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  /** Optional. Not required for classroom login/write/PDF. */
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  /** Optional. Not required for classroom login/write/PDF. */
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
