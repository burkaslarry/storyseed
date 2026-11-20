import { describe, expect, it } from "vitest";
import { csrfOriginGuard } from "./csrf";

type Outcome = "next" | number | "none";

function run(method: string, headers: Record<string, string>) {
  let outcome: Outcome = "none";
  const req = { method, headers } as never;
  const res = {
    status(code: number) {
      outcome = code;
      return this;
    },
    send() {
      return this;
    },
  } as never;
  csrfOriginGuard(req, res, () => {
    outcome = "next";
  });
  return outcome;
}

const cookie = { cookie: "app_session_id=token" };
const host = { host: "school.example" };

describe("csrfOriginGuard", () => {
  it("allows a same-origin mutation that carries the session cookie", () => {
    expect(run("POST", { ...cookie, ...host, origin: "https://school.example" })).toBe("next");
  });

  it("allows a same-origin Referer when Origin is absent", () => {
    expect(run("POST", { ...cookie, ...host, referer: "https://school.example/student" })).toBe("next");
  });

  it("rejects a cookie-authenticated mutation with no Origin or Referer", () => {
    expect(run("POST", { ...cookie, ...host })).toBe(403);
  });

  it("rejects a cross-origin mutation that carries the session cookie", () => {
    expect(run("POST", { ...cookie, ...host, origin: "https://evil.example" })).toBe(403);
  });

  it("allows logins, which run before the session cookie exists", () => {
    expect(run("POST", { ...host, origin: "https://evil.example" })).toBe("next");
  });

  it("allows Bearer clients, which do not send an ambient cookie", () => {
    expect(run("POST", { ...host, authorization: "Bearer token" })).toBe("next");
  });

  it("does not block safe methods", () => {
    expect(run("GET", { ...cookie, ...host, origin: "https://evil.example" })).toBe("next");
  });
});
