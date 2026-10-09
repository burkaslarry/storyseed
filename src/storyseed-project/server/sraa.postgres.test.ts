import { execSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { checkDatabaseHealth } from "./db";

const RENDER_PG_ID = "dpg-d6iok5q4d50c738643c0-a";

function renderSql(sql: string) {
  return execSync(`render psql ${RENDER_PG_ID} --confirm --output text --command ${JSON.stringify(sql)}`, {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
}

describe("SRAA · Render Postgres drill", () => {
  it("Setup — database reachable (DATABASE_URL or Render CLI)", async () => {
    const health = await checkDatabaseHealth();
    if (health.ok) {
      expect(health.ok).toBe(true);
      return;
    }
    const out = renderSql("SELECT 1 AS ok;");
    expect(out).toContain("1");
  });

  it("Setup — storyseed_* tables present", () => {
    const out = renderSql(
      "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'storyseed_%';"
    );
    expect(Number(out.match(/\d+/)?.[0] ?? 0)).toBeGreaterThanOrEqual(10);
  });

  it("Request — drill seed rows loaded", () => {
    const student = renderSql("SELECT COUNT(*) FROM storyseed_users WHERE open_id = 'student_student-p6-drill';");
    const teacher = renderSql("SELECT COUNT(*) FROM storyseed_users WHERE role = 'teacher';");
    const trash = renderSql("SELECT COUNT(*) FROM storyseed_trash_accounts WHERE username = 'trash-drill-user';");
    const writing = renderSql(
      "SELECT COUNT(*) FROM storyseed_writings w JOIN storyseed_users u ON u.id = w.student_id WHERE u.open_id = 'student_student-p6-drill';"
    );
    const assessment = renderSql(
      "SELECT COUNT(*) FROM storyseed_writing_assessments a JOIN storyseed_writings w ON w.id = a.writing_id JOIN storyseed_users u ON u.id = w.student_id WHERE u.open_id = 'student_student-p6-drill';"
    );
    expect(Number(student.match(/\d+/)?.[0])).toBeGreaterThanOrEqual(1);
    expect(Number(teacher.match(/\d+/)?.[0])).toBeGreaterThanOrEqual(1);
    expect(Number(trash.match(/\d+/)?.[0])).toBeGreaterThanOrEqual(1);
    expect(Number(writing.match(/\d+/)?.[0])).toBeGreaterThanOrEqual(1);
    expect(Number(assessment.match(/\d+/)?.[0])).toBeGreaterThanOrEqual(1);
  });

  it("Assert — student owns writing; teacher can see assessment", () => {
    const owned = renderSql(
      "SELECT w.id FROM storyseed_writings w JOIN storyseed_users u ON u.id = w.student_id WHERE u.open_id = 'student_student-p6-drill' LIMIT 1;"
    );
    const writingId = Number(owned.match(/\d+/)?.[0]);
    expect(writingId).toBeGreaterThan(0);
    const assess = renderSql(`SELECT COUNT(*) FROM storyseed_writing_assessments WHERE writing_id = ${writingId};`);
    expect(Number(assess.match(/\d+/)?.[0])).toBeGreaterThanOrEqual(1);
  });

  it("Archive — trash account row exists without deleting student drill user", () => {
    const trash = renderSql("SELECT COUNT(*) FROM storyseed_trash_accounts WHERE username = 'trash-drill-user';");
    const student = renderSql("SELECT COUNT(*) FROM storyseed_users WHERE open_id = 'student_student-p6-drill';");
    expect(Number(trash.match(/\d+/)?.[0])).toBeGreaterThanOrEqual(1);
    expect(Number(student.match(/\d+/)?.[0])).toBeGreaterThanOrEqual(1);
  });
});
