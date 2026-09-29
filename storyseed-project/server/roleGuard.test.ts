import { describe, expect, it } from "vitest";
import { requireRole } from "./routers";

describe("role guard", () => {
  it("allows an admin to use admin-enabled procedures", async () => {
    await expect(requireRole({ user: { id: 1, role: "admin" } }, ["teacher", "admin"])).resolves.toBeUndefined();
  });

  it("rejects a normal account without a class membership", async () => {
    await expect(requireRole({ user: { id: 999999, role: "user" } }, ["teacher"])).rejects.toThrow("你沒有權限");
  });
});
