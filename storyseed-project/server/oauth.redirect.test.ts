import { describe, expect, it } from "vitest";
import { getOAuthSuccessRedirect } from "./_core/oauth";

describe("teacher OAuth redirect", () => {
  it("returns the teacher workspace after staff sign-in", () => {
    expect(getOAuthSuccessRedirect()).toBe("/teacher");
  });
});
