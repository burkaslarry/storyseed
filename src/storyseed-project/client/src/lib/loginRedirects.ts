export const teacherWorkspacePath = "/teacher" as const;
export const studentWorkspacePath = "/student" as const;
export const teacherLoginPath = "/teacher-login" as const;
export const studentLoginPath = "/student-login" as const;
export const adminLoginPath = "/admin-login" as const;

export function getTeacherLoginRedirect() {
  return teacherWorkspacePath;
}

export function getStudentLoginRedirect() {
  return studentWorkspacePath;
}

/** School login page for the current path — never Manus OAuth. */
export function getSchoolLoginPath(pathname = typeof window !== "undefined" ? window.location.pathname : "/") {
  if (pathname.startsWith("/admin")) return adminLoginPath;
  if (pathname.startsWith("/teacher")) return teacherLoginPath;
  if (pathname.startsWith("/student")) return studentLoginPath;
  return studentLoginPath;
}

export function redirectToSchoolLogin(pathname?: string) {
  if (typeof window === "undefined") return;
  const target = getSchoolLoginPath(pathname ?? window.location.pathname);
  if (window.location.pathname === target) return;
  window.location.href = target;
}
