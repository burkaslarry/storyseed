/*
 * [F001][S032] Process-wide concurrency gates for AI and PDF.
 * Input: a named resource and a max in-flight count.
 * Process: admit or reject immediately; release in a finally block.
 * Output: throws TOO_MANY_REQUESTS when the classroom process is saturated.
 */
import { TRPCError } from "@trpc/server";

const inFlight = new Map<string, number>();

export function tryAcquireSlot(resource: string, max: number): boolean {
  const current = inFlight.get(resource) ?? 0;
  if (current >= max) return false;
  inFlight.set(resource, current + 1);
  return true;
}

export function releaseSlot(resource: string) {
  const current = inFlight.get(resource) ?? 0;
  if (current <= 1) inFlight.delete(resource);
  else inFlight.set(resource, current - 1);
}

export function assertSlot(resource: string, max: number, message: string) {
  if (!tryAcquireSlot(resource, max)) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message,
    });
  }
}

export async function withSlot<T>(
  resource: string,
  max: number,
  message: string,
  work: () => Promise<T>
): Promise<T> {
  assertSlot(resource, max, message);
  try {
    return await work();
  } finally {
    releaseSlot(resource);
  }
}

/** Exposed for tests. */
export function __resetConcurrencyForTests() {
  inFlight.clear();
}

export function __inFlightForTests(resource: string) {
  return inFlight.get(resource) ?? 0;
}
