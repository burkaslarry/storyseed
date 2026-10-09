export const teacherWorkspacePath = "/teacher" as const;
export const studentWorkspacePath = "/student" as const;

export function getTeacherLoginRedirect() {
  return teacherWorkspacePath;
}

export function getStudentLoginRedirect() {
  return studentWorkspacePath;
}
