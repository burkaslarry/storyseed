/*
 * Shape of a proofreading result: four rubric rows (0-25) and up to eight
 * issue cards. `parseEvaluationContent` falls back to a safe empty-style
 * evaluation when the model returns something that does not match.
 * The fallback must stay in place so a bad model reply never becomes a
 * ghostwritten draft.
 */
import { z } from "zod";

export const rubricKey = z.enum(["ideasVoice", "structure", "language", "revision"]);
export const issueCategory = z.enum(["grammar", "word_choice", "punctuation", "structure", "clarity"]);
export const issueStatus = z.enum(["pending", "resolved", "needs_teacher_review"]);

export const writingEvaluationSchema = z.object({
  level: z.enum(["P5", "P6"]),
  rubric: z.array(z.object({
    key: rubricKey,
    label: z.string().min(1).max(80),
    score: z.number().int().min(0).max(25),
    reason: z.string().min(1).max(300),
  })).length(4),
  strengths: z.array(z.string().min(1)).min(1).max(3),
  nextSteps: z.array(z.string().min(1)).min(1).max(3),
  issues: z.array(z.object({
    id: z.string().min(1).max(32),
    category: issueCategory,
    fragment: z.string().min(1).max(160),
    explanation: z.string().min(1).max(300),
    hint: z.string().min(1).max(260),
    studentRevision: z.string().max(1200).default(""),
    status: issueStatus.default("pending"),
  })).max(8),
});

export type WritingEvaluation = z.infer<typeof writingEvaluationSchema>;

const rubricLabels = { ideasVoice: "Ideas & Creativity", structure: "Structure", language: "Language", revision: "Revision Effort" } as const;

export function createFallbackEvaluation(level: "P5" | "P6" = "P5"): WritingEvaluation {
  return {
    level,
    rubric: (Object.keys(rubricLabels) as Array<keyof typeof rubricLabels>).map((key) => ({ key, label: rubricLabels[key], score: 15, reason: level === "P5" ? "先完成一個清楚的小目標，再逐步加強。" : "你已經有基礎方向，下一步是讓內容更具體及有層次。" })),
    strengths: ["你已經有自己的創作方向。"],
    nextSteps: ["請選一張問題卡，先自己修改一個小地方。"],
    issues: [],
  };
}

export const fallbackEvaluation = createFallbackEvaluation("P5");

export function normalizeEvaluation(value: unknown, level: "P5" | "P6" = "P5"): WritingEvaluation {
  const parsed = writingEvaluationSchema.safeParse(value);
  return parsed.success ? parsed.data : createFallbackEvaluation(level);
}

export function parseEvaluationContent(content: unknown, level: "P5" | "P6" = "P5"): WritingEvaluation {
  if (typeof content !== "string") return createFallbackEvaluation(level);
  try { return normalizeEvaluation(JSON.parse(content), level); } catch { return createFallbackEvaluation(level); }
}
