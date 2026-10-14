import { describe, expect, it, vi } from "vitest";
import * as db from "./db";
import { requireRole } from "./routers";

describe("role guard", () => {
  it("allows an admin to use admin-enabled procedures", async () => {
    await expect(requireRole({ user: { id: 1, role: "admin" } }, ["teacher", "admin"])).resolves.toBeUndefined();
  });

  it("rejects a normal account without a class membership", async () => {
    await expect(requireRole({ user: { id: 999999, role: "user" } }, ["teacher"])).rejects.toThrow("你沒有權限");
  });
});

it("rejects an existing session after its student account is soft-disabled", async () => {
  const mock = vi.spyOn(db, "getStudentAccountByUsername").mockResolvedValue({ active: false, mustChangeCode: false } as any);
  await expect(requireRole({ user: { id: 1, role: "student", openId: "student_test" } }, ["student"])).rejects.toThrow("停用");
  mock.mockRestore();
});
