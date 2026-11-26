import { describe, expect, it, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import {
  assertSlot,
  releaseSlot,
  withSlot,
  __resetConcurrencyForTests,
  __inFlightForTests,
} from "./concurrency";

describe("process-wide concurrency slots", () => {
  beforeEach(() => {
    __resetConcurrencyForTests();
  });

  it("admits up to max then rejects", () => {
    assertSlot("coach", 2, "busy");
    assertSlot("coach", 2, "busy");
    expect(__inFlightForTests("coach")).toBe(2);
    expect(() => assertSlot("coach", 2, "busy")).toThrow(TRPCError);
    releaseSlot("coach");
    assertSlot("coach", 2, "busy");
    expect(__inFlightForTests("coach")).toBe(2);
  });

  it("releases the slot after withSlot work finishes", async () => {
    const value = await withSlot("pdf", 1, "busy", async () => "ok");
    expect(value).toBe("ok");
    expect(__inFlightForTests("pdf")).toBe(0);
  });

  it("releases the slot when work throws", async () => {
    await expect(
      withSlot("pdf", 1, "busy", async () => {
        throw new Error("boom");
      })
    ).rejects.toThrow("boom");
    expect(__inFlightForTests("pdf")).toBe(0);
  });
});
