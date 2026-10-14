import { execFileSync } from "node:child_process";
import { beforeAll, describe, expect, it } from "vitest";

/* [F010][S028] Audit Render schema and seed relationships with one read-only round-trip.
 * Input: Existing Render CLI authentication.
 * Process: Aggregate counts without names, emails, passwords or student writing bodies.
 * Output: Setup/request/ownership/archive assertions; remote setup has a bounded timeout.
 */
describe("SRAA · Render Postgres drill", () => {
  let data: Record<string, number>;
  beforeAll(() => {
    const sql = `SELECT json_build_object(
      'reachable', 1,
      'tables', (SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'storyseed_%'),
      'students', (SELECT count(*) FROM storyseed_users WHERE open_id='student_student-p6-drill'),
      'teachers', (SELECT count(*) FROM storyseed_users WHERE role='teacher'),
      'trash', (SELECT count(*) FROM storyseed_trash_accounts WHERE username='trash-drill-user'),
      'writing', (SELECT count(*) FROM storyseed_writings w JOIN storyseed_users u ON u.id=w.student_id WHERE u.open_id='student_student-p6-drill'),
      'assessment', (SELECT count(*) FROM storyseed_writing_assessments a JOIN storyseed_writings w ON w.id=a.writing_id JOIN storyseed_users u ON u.id=w.student_id WHERE u.open_id='student_student-p6-drill'),
      'roster', (SELECT count(*) FROM storyseed_student_accounts WHERE student_email LIKE '%@chungsing.edu.hk'),
      'newTeachers', (SELECT count(*) FROM storyseed_users WHERE email IN ('teach001@gmail.com','teach002@gmail.com') AND role='teacher')
    );`;
    const out = execFileSync("render", ["psql", "dpg-d6iok5q4d50c738643c0-a", "--confirm", "--output", "text", "--command", sql], { encoding: "utf8", timeout: 60000, stdio: ["pipe", "pipe", "pipe"] });
    const match = out.match(/\{[^\n]*\}/); if (!match) throw new Error("Render did not return audit JSON");
    data = JSON.parse(match[0]);
  }, 65000);
  it("Setup — database reachable", () => expect(data.reachable).toBe(1));
  it("Setup — storyseed tables and school roster present", () => { expect(data.tables).toBeGreaterThanOrEqual(10); expect(data.roster).toBe(20); expect(data.newTeachers).toBe(2); });
  it("Request — drill student and teacher accounts loaded", () => { expect(data.students).toBeGreaterThanOrEqual(1); expect(data.teachers).toBeGreaterThanOrEqual(2); });
  it("Assert — writing and assessment ownership links exist", () => { expect(data.writing).toBeGreaterThanOrEqual(1); expect(data.assessment).toBeGreaterThanOrEqual(1); });
  it("Archive — disposable row retained independently of student", () => { expect(data.trash).toBeGreaterThanOrEqual(1); expect(data.students).toBeGreaterThanOrEqual(1); });
});
