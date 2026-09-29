import { describe, expect, it } from "vitest";
import { sanitizeStudentText } from "./routers";

describe("writing coach privacy guard", () => {
  it("redacts email addresses and Hong Kong phone numbers", () => {
    const safe = sanitizeStudentText("請聯絡 alice@example.com 或 9871 7572。故事仍然是我的。");
    expect(safe).not.toContain("alice@example.com");
    expect(safe).not.toContain("9871 7572");
    expect(safe).toContain("[電郵已隱去]");
    expect(safe).toContain("[電話已隱去]");
    expect(safe).toContain("故事仍然是我的");
  });
});
