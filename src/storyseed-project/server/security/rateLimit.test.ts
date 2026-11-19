import { afterEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { assertRateLimit, rateLimitKey } from "./rateLimit";

function catchError(run: () => void) {
  try {
    run();
  } catch (error) {
    return error;
  }
  return undefined;
}

describe("assertRateLimit", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("blocks the 21st attempt and throws TOO_MANY_REQUESTS", () => {
    const key = rateLimitKey("203.0.113.9|w22024", "studentLogin");
    for (let attempt = 0; attempt < 20; attempt += 1) assertRateLimit(key, 20, 15 * 60_000);
    const error = catchError(() => assertRateLimit(key, 20, 15 * 60_000));
    expect(error).toBeInstanceOf(TRPCError);
    expect((error as TRPCError).code).toBe("TOO_MANY_REQUESTS");
    expect((error as TRPCError).message).toContain("請求過於頻繁");
  });

  it("keeps one student's retries from locking out the rest of the class", () => {
    const sharedIp = "203.0.113.10";
    const noisy = rateLimitKey(`${sharedIp}|w22024`, "studentLogin");
    for (let attempt = 0; attempt < 20; attempt += 1) assertRateLimit(noisy, 20, 15 * 60_000);
    expect(catchError(() => assertRateLimit(noisy, 20, 15 * 60_000))).toBeInstanceOf(TRPCError);
    expect(() => assertRateLimit(rateLimitKey(`${sharedIp}|w22025`, "studentLogin"), 20, 15 * 60_000)).not.toThrow();
  });

  it("allows a whole class through the shared-IP ceiling", () => {
    const sharedIp = "203.0.113.11";
    for (let student = 0; student < 40; student += 1) {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        assertRateLimit(rateLimitKey(sharedIp, "studentLoginIp"), 600, 15 * 60_000);
      }
    }
  });

  it("resets the bucket once the window has passed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-19T08:00:00Z"));
    const key = rateLimitKey("203.0.113.12|w22026", "studentLogin");
    for (let attempt = 0; attempt < 20; attempt += 1) assertRateLimit(key, 20, 60_000);
    expect(catchError(() => assertRateLimit(key, 20, 60_000))).toBeInstanceOf(TRPCError);
    vi.setSystemTime(new Date("2026-11-19T08:02:00Z"));
    expect(() => assertRateLimit(key, 20, 60_000)).not.toThrow();
  });
});
