/*
 * A4 anthology PDF for Chung Sing School.
 * Builds a cover, contents, and one page per approved piece.
 * UNFINISHED: this is the only shareable book format. EPUB is not built.
 * CJK text uses bundled Noto Sans TC, an env font path, or the Linux system font.
 */
import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const fontkit: any = require("fontkit");

// Font resolution: env override wins, then the bundled Noto Sans TC fonts
// under <project-root>/fonts, then the Linux system path used by the original
// Manus environment. This keeps PDF generation portable across Windows, macOS
// and Linux without hard-coding a platform-specific font path.
export function resolveCjkFontPath(weight: "Regular" | "Bold"): string {
  const envKey =
    weight === "Regular" ? "NOTO_CJK_REGULAR_PATH" : "NOTO_CJK_BOLD_PATH";
  const envPath = process.env[envKey];
  if (envPath) {
    if (!existsSync(envPath)) {
      throw new Error(`Font path from ${envKey} does not exist: ${envPath}`);
    }
    return envPath;
  }

  const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
  const bundled = join(projectRoot, "fonts", `NotoSansCJKtc-${weight}.otf`);
  if (existsSync(bundled)) return bundled;

  const linuxPath =
    weight === "Regular"
      ? "/usr/share/fonts/opentype/noto/NotoSansCJKsc-Regular.otf"
      : "/usr/share/fonts/opentype/noto/NotoSansCJKsc-Bold.otf";
  if (existsSync(linuxPath)) return linuxPath;

  throw new Error(
    `No CJK font found for weight "${weight}". Set ${envKey} or bundle ` +
      `NotoSansCJKtc-${weight}.otf under the project fonts/ directory.`
  );
}

export type AnthologyPdfItem = {
  order: number;
  authorCode: string;
  title: string;
  level: "P5" | "P6";
  category?: string | null;
  body: string;
  editorNote?: string | null;
};

const pageWidth = 595.28;
const pageHeight = 841.89;
const margin = 58;
const ink = rgb(0.14, 0.25, 0.22);
const forest = rgb(0.12, 0.25, 0.22);
const gold = rgb(0.76, 0.54, 0.22);
const paper = rgb(0.98, 0.97, 0.92);
const mint = rgb(0.86, 0.93, 0.89);

function wrapText(text: string, font: any, size: number, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of text.split(/\n+/)) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }
    const source = paragraph.trim();
    const isEnglish = /[A-Za-z]/.test(source) && !/[\u4e00-\u9fff]/.test(source);
    if (isEnglish) {
      let line = "";
      for (const word of source.split(/\s+/)) {
        const candidate = line ? `${line} ${word}` : word;
        if (line && font.widthOfTextAtSize(candidate, size) > maxWidth) {
          lines.push(line);
          line = word;
        } else {
          line = candidate;
        }
      }
      if (line) lines.push(line);
    } else {
      let line = "";
      for (const char of Array.from(source)) {
        const candidate = line + char;
        if (line && font.widthOfTextAtSize(candidate, size) > maxWidth) {
          lines.push(line);
          line = char;
        } else {
          line = candidate;
        }
      }
      if (line) lines.push(line);
    }
  }
  return lines;
}

function drawSeed(page: any, x: number, y: number, scale = 1) {
  page.drawEllipse({ x, y, xScale: 16 * scale, yScale: 28 * scale, rotate: degrees(35), color: gold, opacity: 0.95 });
  page.drawLine({ start: { x: x - 1 * scale, y: y - 20 * scale }, end: { x: x - 1 * scale, y: y - 72 * scale }, thickness: 2.5 * scale, color: forest });
  page.drawLine({ start: { x: x - 1 * scale, y: y - 45 * scale }, end: { x: x - 27 * scale, y: y - 30 * scale }, thickness: 2 * scale, color: forest });
  page.drawLine({ start: { x: x - 1 * scale, y: y - 55 * scale }, end: { x: x + 26 * scale, y: y - 72 * scale }, thickness: 2 * scale, color: forest });
}

export async function buildAnthologyPdf(items: AnthologyPdfItem[]) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit as any);
  const fontBytes = await readFile(resolveCjkFontPath("Regular"));
  const boldBytes = await readFile(resolveCjkFontPath("Bold"));
  const regular = await pdf.embedFont(fontBytes, { subset: true });
  const bold = await pdf.embedFont(boldBytes, { subset: true });
  const english = await pdf.embedFont(StandardFonts.Helvetica);
  const englishBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const cover = pdf.addPage([pageWidth, pageHeight]);
  cover.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: paper });
  cover.drawRectangle({ x: 0, y: pageHeight - 190, width: pageWidth, height: 190, color: forest });
  cover.drawCircle({ x: pageWidth - 80, y: pageHeight - 100, size: 120, color: mint, opacity: 0.18 });
  cover.drawCircle({ x: pageWidth - 118, y: pageHeight - 137, size: 42, color: gold, opacity: 0.9 });
  drawSeed(cover, 116, pageHeight - 126, 1.6);
  cover.drawText("鍾聲學校", { x: margin, y: pageHeight - 82, size: 25, font: bold, color: rgb(1, 1, 1) });
  cover.drawText("CHUNG SING SCHOOL", { x: margin + 2, y: pageHeight - 111, size: 10, font: englishBold, color: mint });
  cover.drawText("AI Creative Writing Class", { x: margin, y: pageHeight - 285, size: 17, font: englishBold, color: gold });
  cover.drawText("學生創意寫作作品集", { x: margin, y: pageHeight - 335, size: 34, font: bold, color: ink });
  cover.drawText("Stories that grow from a small idea", { x: margin, y: pageHeight - 371, size: 14, font: english, color: forest });
  cover.drawLine({ start: { x: margin, y: pageHeight - 412 }, end: { x: pageWidth - margin, y: pageHeight - 412 }, thickness: 1.2, color: gold, opacity: 0.7 });
  cover.drawText("2026–2027 School Year", { x: margin, y: 120, size: 13, font: englishBold, color: forest });
  cover.drawText("P5 · P6", { x: margin, y: 94, size: 12, font: english, color: gold });
  cover.drawText("StorySeed Studio", { x: pageWidth - 180, y: 94, size: 11, font: englishBold, color: forest });

  const contents = pdf.addPage([pageWidth, pageHeight]);
  contents.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: paper });
  contents.drawText("作品目錄", { x: margin, y: pageHeight - 88, size: 27, font: bold, color: forest });
  contents.drawText("CONTENTS", { x: margin + 2, y: pageHeight - 111, size: 9, font: englishBold, color: gold });
  contents.drawLine({ start: { x: margin, y: pageHeight - 135 }, end: { x: pageWidth - margin, y: pageHeight - 135 }, thickness: 1, color: mint });
  let y = pageHeight - 180;
  for (const item of items) {
    contents.drawText(String(item.order).padStart(2, "0"), { x: margin, y, size: 13, font: englishBold, color: gold });
    contents.drawText(item.title, { x: margin + 42, y, size: 13, font: bold, color: ink, maxWidth: 320 });
    contents.drawText(`${item.authorCode} · ${item.level}`, { x: pageWidth - 170, y, size: 10, font: english, color: forest });
    y -= 36;
  }
  contents.drawText("每一篇作品都保留作者的原創聲音，並經過學生修訂及導師審閱。", { x: margin, y: 95, size: 11, font: regular, color: forest });

  for (const item of items) {
    const page = pdf.addPage([pageWidth, pageHeight]);
    page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: paper });
    page.drawRectangle({ x: 0, y: pageHeight - 14, width: pageWidth, height: 14, color: forest });
    page.drawText(String(item.order).padStart(2, "0"), { x: margin, y: pageHeight - 75, size: 16, font: englishBold, color: gold });
    page.drawText(item.category ?? "Student Writing", { x: margin + 44, y: pageHeight - 72, size: 10, font: englishBold, color: forest });
    page.drawText(item.title, { x: margin, y: pageHeight - 135, size: 28, font: bold, color: ink, maxWidth: pageWidth - margin * 2 });
    page.drawText(`${item.authorCode} · ${item.level}`, { x: margin, y: pageHeight - 162, size: 11, font: english, color: forest });
    page.drawLine({ start: { x: margin, y: pageHeight - 188 }, end: { x: pageWidth - margin, y: pageHeight - 188 }, thickness: 1, color: mint });
    let bodyY = pageHeight - 230;
    for (const line of wrapText(item.body, regular, 13, pageWidth - margin * 2)) {
      if (bodyY < 105) break;
      if (line) page.drawText(line, { x: margin, y: bodyY, size: 13, font: regular, color: ink });
      bodyY -= line ? 22 : 12;
    }
    if (item.editorNote) {
      page.drawRectangle({ x: margin, y: 54, width: pageWidth - margin * 2, height: 40, color: mint, opacity: 0.8 });
      page.drawText(`導師備註：${item.editorNote}`, { x: margin + 12, y: 69, size: 9, font: regular, color: forest, maxWidth: pageWidth - margin * 2 - 24 });
    }
    page.drawText("StorySeed · Chung Sing School · 2026–2027", { x: margin, y: 28, size: 8, font: english, color: forest });
  }

  return Buffer.from(await pdf.save());
}
