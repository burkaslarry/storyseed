import { describe, expect, it } from "vitest";
import { fallbackEvaluation, normalizeEvaluation, parseEvaluationContent } from "./writingEvaluation";

const validP6 = {
  level: "P6",
  rubric: [
    { key: "ideasVoice", label: "Ideas & Creativity", score: 16, reason: "有清楚的主題。" },
    { key: "structure", label: "Structure", score: 15, reason: "段落大致連貫。" },
    { key: "language", label: "Language", score: 14, reason: "可再檢查時態。" },
    { key: "revision", label: "Revision Effort", score: 13, reason: "已嘗試修改。" },
  ],
  strengths: ["清楚的主題"],
  nextSteps: ["檢查時態"],
  issues: [{ id: "i-1", category: "grammar", fragment: "She go", explanation: "主語與動詞需要配合。", hint: "你會怎樣修改動詞？" }],
};

describe("writing evaluation parser", () => {
  it("keeps a valid P6 rubric and issue card", () => {
    const result = normalizeEvaluation(validP6);
    expect(result.level).toBe("P6");
    expect(result.rubric.find((item) => item.key === "language")?.score).toBe(14);
    expect(result.issues[0]?.category).toBe("grammar");
    expect(result.issues[0]?.hint).toContain("修改");
    expect(result.issues[0]?.studentRevision).toBe("");
    expect(result.issues[0]?.status).toBe("pending");
  });

  it("preserves a student's revision and teacher follow-up status", () => {
    const result = normalizeEvaluation({ ...validP6, issues: [{ ...validP6.issues[0], studentRevision: "She goes to the garden.", status: "needs_teacher_review" }] });
    expect(result.issues[0]?.studentRevision).toContain("garden");
    expect(result.issues[0]?.status).toBe("needs_teacher_review");
  });

  it("falls back for malformed JSON and invalid rubric data", () => {
    expect(parseEvaluationContent("not-json")).toEqual(fallbackEvaluation);
    expect(normalizeEvaluation({ scores: { ideasVoice: 99 } })).toEqual(fallbackEvaluation);
  });

  it("rejects unsupported issue categories instead of passing them to the UI", () => {
    const invalid = { ...validP6, issues: [{ ...validP6.issues[0], category: "rewrite" }] };
    expect(normalizeEvaluation(invalid)).toEqual(fallbackEvaluation);
  });
});
