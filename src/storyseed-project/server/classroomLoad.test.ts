import { afterEach, describe, expect, it } from "vitest";
import { assertRateLimit, rateLimitKey } from "./security/rateLimit";
import { isAnthologyPdfBlocked } from "./routers";

describe("classroom concurrent login envelope", () => {
  afterEach(() => {
    delete process.env.BLOCK_ANTHOLOGY_PDF;
  });

  it("allows 40 distinct students × 1 login attempt under the shared-IP ceiling", () => {
    const stamp = Date.now();
    const ip = `203.0.113.${stamp % 200}`;
    for (let i = 1; i <= 40; i += 1) {
      const username = `load-${stamp}-${String(i).padStart(2, "0")}`;
      expect(() =>
        assertRateLimit(rateLimitKey(`student:${username}`, "studentLogin"), 20, 15 * 60 * 1000)
      ).not.toThrow();
      expect(() =>
        assertRateLimit(rateLimitKey(ip, "studentLoginIp"), 600, 15 * 60 * 1000)
      ).not.toThrow();
    }
  });

  it("allows a teacher login in parallel with the student wave", () => {
    const stamp = Date.now();
    const ip = `203.0.114.${stamp % 200}`;
    expect(() =>
      assertRateLimit(rateLimitKey(`teacher:teacher-${stamp}@chungsing.edu.hk`, "teacherLogin"), 10, 15 * 60 * 1000)
    ).not.toThrow();
    expect(() =>
      assertRateLimit(rateLimitKey(ip, "teacherLoginIp"), 100, 15 * 60 * 1000)
    ).not.toThrow();
  });

  it("defaults BLOCK_ANTHOLOGY_PDF to blocked for Hostinger classroom safety", () => {
    delete process.env.BLOCK_ANTHOLOGY_PDF;
    expect(isAnthologyPdfBlocked()).toBe(true);
    process.env.BLOCK_ANTHOLOGY_PDF = "true";
    expect(isAnthologyPdfBlocked()).toBe(true);
    process.env.BLOCK_ANTHOLOGY_PDF = "false";
    expect(isAnthologyPdfBlocked()).toBe(false);
    process.env.BLOCK_ANTHOLOGY_PDF = "0";
    expect(isAnthologyPdfBlocked()).toBe(false);
  });
});
