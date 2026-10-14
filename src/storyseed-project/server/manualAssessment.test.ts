import { describe, expect, it, vi, beforeEach } from "vitest";
import { parseStudentCsv } from "./accountProvisioning";
const mocked = vi.hoisted(() => ({ get: vi.fn(), save: vi.fn(), access: vi.fn(), db: vi.fn(), role: vi.fn() }));
vi.mock("./db", () => ({ getWritingEvaluation: mocked.get, saveWritingEvaluation: mocked.save, addFeedback: vi.fn(), listFeedback: vi.fn(), listWritingVersions: vi.fn(), saveWritingVersion: vi.fn(), getDb: mocked.db }));
vi.mock("./security/writingAccess", () => ({ assertWritingRead: mocked.access, assertWritingTeacherWrite: mocked.access, assertWritingStudentWrite: mocked.access }));
import { createWritingRouters } from "./writingRouters";
const context = { user: { id: 1, role: "teacher", openId: "teacher_test" }, req: {}, res: {} } as any;
function caller() { return createWritingRouters(mocked.role as any).writingEvaluation.createCaller(context); }
beforeEach(() => { vi.clearAllMocks(); mocked.access.mockResolvedValue({ level: "P6" }); mocked.get.mockResolvedValue(undefined); });
describe("manual grading", () => {
  it("teacher grades a writing with no AI evaluation", async () => {
    const result = await caller().teacherReview({ writingId: 1, rubricOverrides: { ideasVoice: 21, structure: 20, language: 18, revision: 22 }, teacherNote: "Clear sequence" });
    expect(result.rubric.reduce((sum, r) => sum + r.score, 0)).toBe(81);
    expect(mocked.save).toHaveBeenCalledWith(expect.objectContaining({ reviewedAt: expect.any(Date), teacherNote: "Clear sequence" }));
  });
  it("rejects incomplete or invalid scores without saving", async () => {
    await expect(caller().teacherReview({ writingId: 1, rubricOverrides: { ideasVoice: 21 } })).rejects.toThrow("四項");
    await expect(caller().teacherReview({ writingId: 1, rubricOverrides: { ideasVoice: 26 } })).rejects.toThrow();
    expect(mocked.save).not.toHaveBeenCalled();
  });
  it("student reflection cannot overwrite teacher scores or comments", async () => {
    const evaluation = { level: "P6", rubric: ["ideasVoice","structure","language","revision"].map(key => ({ key, label: key, score: 20, reason: "Teacher" })), strengths: ["Good"], nextSteps: ["Revise"], issues: [] };
    const reviewedAt = new Date(); mocked.get.mockResolvedValue({ evaluationData: JSON.stringify(evaluation), level: "P6", teacherNote: "Teacher only", rubricOverrides: "{}", reviewedAt });
    await caller().save({ writingId: 1, level: "P5", evaluation: {}, reflection: "My reflection" });
    expect(mocked.save).toHaveBeenCalledWith(expect.objectContaining({ level: "P6", evaluationData: JSON.stringify(evaluation), reviewedAt, teacherNote: "Teacher only" }));
  });
});
describe("school roster CSV", () => {
  const header = "student ID,student name,student email,student password";
  it("parses BOM, quoted commas and exact school names", () => {
    expect(parseStudentCsv('\uFEFF'+header+'\r\nw00001,"Chan, Amy",amy@example.com,Password01', "5A")[0]).toEqual({ schoolCode: "w00001", username: "w00001", studentName: "Chan, Amy", studentEmail: "amy@example.com", password: "Password01" });
  });
  it("rejects duplicate IDs case-insensitively without exposing passwords", () => {
    expect(() => parseStudentCsv(header+'\nw00001,A,a@example.com,Password01\nW00001,B,b@example.com,Password02', "5A")).toThrow("重複");
  });
  it("rejects missing headers, malformed quotes and mixed classes", () => {
    expect(() => parseStudentCsv('student ID,student name\nw00001,A', "5A")).toThrow("必須");
    expect(() => parseStudentCsv(header+'\nw00001,"A,a@example.com,Password01', "5A")).toThrow("引號");
    expect(() => parseStudentCsv(header+',classCode\nw00001,A,a@example.com,Password01,6B', "5A")).toThrow("班別");
  });
});
