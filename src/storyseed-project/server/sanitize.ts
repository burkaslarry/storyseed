export function sanitizeStudentText(text: string) {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[電郵已隱去]")
    .replace(/(?:\+?852[ -]?)?\d{4}[ -]?\d{4}/g, "[電話已隱去]");
}
