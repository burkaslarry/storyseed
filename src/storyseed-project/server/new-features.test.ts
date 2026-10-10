import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { assertStudentCodeChanged, parseStudentCsv, generateInitialCode, hashInitialCode, verifyInitialCode } from "./accountProvisioning";
import { buildAnthologyPdf, resolveCjkFontPath } from "./anthologyPdf";

describe("student account provisioning", () => {
  it("parses school codes without retaining names", () => {
    const rows = parseStudentCsv("schoolCode,classCode\nP6-01,6F\nP6-02,6F", "6F");
    expect(rows).toEqual([
      { schoolCode: "P6-01", username: "student-p6-01" },
      { schoolCode: "P6-02", username: "student-p6-02" },
    ]);
  });

  it("rejects a mixed-class import", () => {
    expect(() => parseStudentCsv("schoolCode,classCode\nP6-01,5A", "6F")).toThrow("班別");
  });

  it("creates non-empty one-time codes and MD5 hashes", () => {
    const code = generateInitialCode();
    const hash = hashInitialCode(code);
    expect(code).toHaveLength(10);
    expect(hash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{32}$/);
    expect(hash).not.toContain(code);
    expect(verifyInitialCode(code, hash)).toBe(true);
    expect(verifyInitialCode(`${code}X`, hash)).toBe(false);
    expect(verifyInitialCode("DRILLCODE01", "cf8d4f403d288a1184fd1df9e32653d8")).toBe(true);
    expect(() => assertStudentCodeChanged(1)).toThrow("首次登入改碼");
    expect(() => assertStudentCodeChanged(0)).not.toThrow();
  });
});

describe("anthology PDF template", () => {
  it("resolves bundled CJK fonts for the current platform", () => {
    for (const weight of ["Regular", "Bold"] as const) {
      const path = resolveCjkFontPath(weight);
      expect(existsSync(path)).toBe(true);
    }
  });

  it("generates a printable PDF with a school cover and one work page", async () => {
    const pdf = await buildAnthologyPdf([{ order: 1, authorCode: "P6-01", title: "An Unlucky Day", level: "P6", category: "Story", body: "Last Sunday, Anna was walking while she was playing on her mobile phone.", editorNote: "Keep the clear sequence of events." }]);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(1000);
  });
});
