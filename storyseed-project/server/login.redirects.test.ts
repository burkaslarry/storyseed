import { describe, expect, it } from "vitest";
import { getStudentLoginRedirect, getTeacherLoginRedirect } from "../client/src/lib/loginRedirects";

describe("login workspace redirects", () => {
  it("keeps teacher and student landing paths separate", () => {
    expect(getTeacherLoginRedirect()).toBe("/teacher");
    expect(getStudentLoginRedirect()).toBe("/student");
    expect(getTeacherLoginRedirect()).not.toBe(getStudentLoginRedirect());
  });
});
