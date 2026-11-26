import { describe, expect, it } from "vitest";
import {
  getSchoolLoginPath,
  getStudentLoginRedirect,
  getTeacherLoginRedirect,
  adminLoginPath,
  studentLoginPath,
  teacherLoginPath,
} from "../client/src/lib/loginRedirects";

describe("login workspace redirects", () => {
  it("keeps teacher and student landing paths separate", () => {
    expect(getTeacherLoginRedirect()).toBe("/teacher");
    expect(getStudentLoginRedirect()).toBe("/student");
    expect(getTeacherLoginRedirect()).not.toBe(getStudentLoginRedirect());
  });

  it("routes unauthorized classroom paths to school login pages, not OAuth", () => {
    expect(getSchoolLoginPath("/student")).toBe(studentLoginPath);
    expect(getSchoolLoginPath("/student/anything")).toBe(studentLoginPath);
    expect(getSchoolLoginPath("/teacher")).toBe(teacherLoginPath);
    expect(getSchoolLoginPath("/teacher-login")).toBe(teacherLoginPath);
    expect(getSchoolLoginPath("/admin")).toBe(adminLoginPath);
    expect(getSchoolLoginPath("/")).toBe(studentLoginPath);
  });
});
