import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));
import { invokeLLM } from "./_core/llm";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const suggestions = {
  alternatives: [
    { title: "A", direction: "Which school corner do you remember?" },
    { title: "B", direction: "What sound made the moment memorable?" },
    { title: "C", direction: "What choice did you make?" },
  ],
  observation: "Choose one detail and explain why it matters to you.",
};
const caller = (user: unknown) => appRouter.createCaller({ user, req: {}, res: {} } as TrpcContext);

describe("curriculum planning API", () => {
  beforeEach(() => vi.clearAllMocks());
  it("requires a session before sending student ideas to the AI provider", async () => {
    await expect(caller(null).writingCoach.improve({ plan: "My school", level: "P5", lang: "en" })).rejects.toThrow();
    expect(invokeLLM).not.toHaveBeenCalled();
  });
  it("redacts student identifiers and returns validated planning choices", async () => {
    vi.mocked(invokeLLM).mockResolvedValue({ choices: [{ message: { content: JSON.stringify(suggestions) } }] } as any);
    const result = await caller({ id: 90001, role: "student" }).writingCoach.improve({ plan: "My school, me@example.com, 9123 4567", level: "P6", lang: "zh" });
    expect(result).toEqual(suggestions);
    const request = vi.mocked(invokeLLM).mock.calls[0][0];
    const text = JSON.stringify(request.messages);
    expect(text).not.toContain("me@example.com");
    expect(text).not.toContain("9123 4567");
    expect(text).toContain("must never write a complete");
    expect(text).toContain("Traditional Chinese");
  });
  it("rejects an unusable AI result instead of displaying it as completed planning", async () => {
    vi.mocked(invokeLLM).mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ alternatives: [], observation: "" }) } }] } as any);
    await expect(caller({ id: 90002, role: "student" }).writingCoach.improve({ plan: "My idea", level: "P5", lang: "en" })).rejects.toThrow();
  });
});
