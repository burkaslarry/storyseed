/*
 * Process environment used by auth, the database, and the built-in LLM.
 * Empty strings mean demo mode: the UI loads, but login, saves, and live
 * AI answers do not. See LOCAL_ENV_TEMPLATE.txt.
 *
 * UNFINISHED for hosting outside Manus: OAuth, the Forge LLM, and storage
 * still expect these Manus variables. There is no second provider yet.
 */
export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
