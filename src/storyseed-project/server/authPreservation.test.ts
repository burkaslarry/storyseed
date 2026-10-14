import { expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ conflict: vi.fn(), query: vi.fn().mockResolvedValue({ rows: [] }) }));
vi.mock("pg", () => ({ default: { Pool: class { query = m.query; } } }));
vi.mock("drizzle-orm/node-postgres", () => ({ drizzle: () => ({ insert: () => ({ values: () => ({ onConflictDoUpdate: m.conflict }) }) }) }));
import { upsertUser } from "./db";
it("session refresh preserves password, email, name and explicit role", async () => {
  process.env.DATABASE_URL = "postgres://example/test";
  await upsertUser({ openId: "teacher_test", lastSignedIn: new Date() });
  const set = m.conflict.mock.calls[0][0].set;
  expect(set).not.toHaveProperty("passwordHash"); expect(set).not.toHaveProperty("email"); expect(set).not.toHaveProperty("name"); expect(set).not.toHaveProperty("role");
});
