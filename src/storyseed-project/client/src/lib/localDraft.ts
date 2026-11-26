/** Browser-local draft backup so a failed sync does not silently lose work. */

function key(openId: string, lessonNo: number) {
  return `storyseed-draft:v1:${openId}:${lessonNo}`;
}

export function loadLocalDraft(openId: string | null | undefined, lessonNo: number): string | null {
  if (!openId || typeof localStorage === "undefined") return null;
  try {
    return localStorage.getItem(key(openId, lessonNo));
  } catch {
    return null;
  }
}

export function saveLocalDraft(openId: string | null | undefined, lessonNo: number, body: string) {
  if (!openId || typeof localStorage === "undefined") return;
  try {
    if (!body.trim()) {
      localStorage.removeItem(key(openId, lessonNo));
      return;
    }
    localStorage.setItem(key(openId, lessonNo), body);
  } catch {
    // Quota / private mode — ignore; server save is still the source of truth.
  }
}

export function clearLocalDraft(openId: string | null | undefined, lessonNo: number) {
  if (!openId || typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(key(openId, lessonNo));
  } catch {
    // ignore
  }
}
