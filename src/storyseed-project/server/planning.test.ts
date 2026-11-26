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

  it("fails coach ask when DEEPSEEK_API_KEY is missing", async () => {
    // ENV is read at process start; CI/local tests run without DEEPSEEK_API_KEY.
    await expect(
      caller({ id: 90001, role: "teacher", openId: "teacher_test" }).writingCoach.ask({
        question: "How do I start?",
        level: "P5",
        lang: "en",
      })
    ).rejects.toThrow(/DEEPSEEK_API_KEY/);
  });
});
