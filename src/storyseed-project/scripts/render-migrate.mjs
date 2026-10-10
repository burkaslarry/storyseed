import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PG_ID = "dpg-d6iok5q4d50c738643c0-a";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function runSqlFile(relativePath) {
  const sql = readFileSync(join(root, relativePath), "utf8");
  execSync(`render psql ${PG_ID} --confirm --output text --command ${JSON.stringify(sql)}`, {
    stdio: "pipe",
    encoding: "utf8",
  });
  console.log(`Applied ${relativePath}`);
}

const mode = process.argv[2] ?? "migrate";
if (mode === "seed") {
  runSqlFile("drizzle/storyseed_seed_drill.sql");
} else if (mode === "v3") {
  runSqlFile("drizzle/storyseed_postgres_v3_password_auth.sql");
  runSqlFile("drizzle/storyseed_seed_drill.sql");
} else if (mode === "v4") {
  runSqlFile("drizzle/storyseed_postgres_v4_manage.sql");
  runSqlFile("drizzle/storyseed_seed_drill.sql");
} else if (mode === "v5") {
  runSqlFile("drizzle/storyseed_postgres_v5_security.sql");
} else {
  runSqlFile("drizzle/storyseed_postgres_v2.sql");
  runSqlFile("drizzle/storyseed_postgres_v3_password_auth.sql");
  runSqlFile("drizzle/storyseed_postgres_v4_manage.sql");
  runSqlFile("drizzle/storyseed_postgres_v5_security.sql");
  runSqlFile("drizzle/storyseed_seed_drill.sql");
}
