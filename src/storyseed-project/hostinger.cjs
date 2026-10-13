/* [F010][S020] Launch StorySeed through a CommonJS-compatible hosting entry.
 * Input: Built ESM server and Hostinger environment variables.
 * Process: Import the server asynchronously and report startup failures.
 * Output: The HTTP application; failures appear in the host runtime log.
 */
process.env.NODE_ENV = process.env.NODE_ENV || "production";
console.log("[StorySeed] Loading production server");
import("./dist/server/index.js").catch((error) => {
  console.error("[StorySeed] Startup failed:", error);
  process.exitCode = 1;
});
