import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const caller = (user: unknown) =>
  appRouter.createCaller({ user, req: {}, res: {} } as TrpcContext);

describe("curriculum planning API", () => {
  it("rejects unauthenticated improve calls", async () => {
    await expect(
      caller(null).writingCoach.improve({ plan: "My school", level: "P5", lang: "en" })
    ).rejects.toThrow();
  });

  it("keeps AI coach disabled without Forge credentials", async () => {
    await expect(
      caller({ id: 90001, role: "student", openId: "student_w22001" }).writingCoach.improve({
        plan: "My school",
        level: "P6",
        lang: "zh",
      })
    ).rejects.toThrow(/AI 功能已關閉/);

    await expect(
      caller({ id: 90001, role: "student", openId: "student_w22001" }).writingCoach.ask({
        question: "How do I start?",
        level: "P5",
        lang: "en",
      })
    ).rejects.toThrow(/AI 功能已關閉/);

    await expect(
      caller({ id: 90001, role: "student", openId: "student_w22001" }).writingCoach.suggest({
        mode: "idea",
        draft: "Once upon a time",
        level: "P5",
      })
    ).rejects.toThrow(/AI 功能已關閉/);
  });
});
