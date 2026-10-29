/*
 * [F007][S028] Build the A4 anthology PDF for the Chung Sing School print edition.
 * Input: approved pieces in display order, each with author code, title, level,
 *        body and optional editor note.
 * Process: draw a cover, reserve contents pages, then lay out each piece with
 *          automatic page breaks; fill the contents with real page numbers and
 *          add a signature/date line at the end of every piece.
 * Output: a PDF where every colour is DeviceCMYK, every font is an embedded
 *         Noto Sans CJK TC subset, and no raster images are used.
 */
import { PDFDocument, degrees, cmyk } from "pdf-lib";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const fontkit: any = require("fontkit");

// Font resolution: env override wins, then the fonts bundled next to the server
// source, then the project root used by the hosting runtime, then Linux system
// fonts. This keeps PDF generation portable across Windows, macOS and Linux.
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

  const here = dirname(fileURLToPath(import.meta.url));
  const fileName = `NotoSansCJKtc-${weight}.otf`;
  const candidates = [
    join(here, "..", "fonts", fileName),
    join(process.cwd(), "fonts", fileName),
    join(here, "..", "..", "fonts", fileName),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

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
const contentWidth = pageWidth - margin * 2;

// DeviceCMYK values only. CMYK avoids the RGB colour shifts that print shops
// compensate for, and keeps every object in one colour space.
const ink = cmyk(0.78, 0.55, 0.62, 0.62);
const forest = cmyk(0.82, 0.48, 0.62, 0.55);
const gold = cmyk(0.13, 0.36, 0.92, 0.12);
const paper = cmyk(0.02, 0.03, 0.08, 0);
const mint = cmyk(0.18, 0, 0.12, 0.02);
const white = cmyk(0, 0, 0, 0);

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
  page.drawEllipse({ x, y, xScale: 16 * scale, yScale: 28 * scale, rotate: degrees(35), color: gold });
  page.drawLine({ start: { x: x - 1 * scale, y: y - 20 * scale }, end: { x: x - 1 * scale, y: y - 72 * scale }, thickness: 2.5 * scale, color: forest });
  page.drawLine({ start: { x: x - 1 * scale, y: y - 45 * scale }, end: { x: x - 27 * scale, y: y - 30 * scale }, thickness: 2 * scale, color: forest });
  page.drawLine({ start: { x: x - 1 * scale, y: y - 55 * scale }, end: { x: x + 26 * scale, y: y - 72 * scale }, thickness: 2 * scale, color: forest });
}

export async function buildAnthologyPdf(items: AnthologyPdfItem[]) {
  const pdf = await PDFDocument.create();
  pdf.setTitle("鍾聲學校學生創意寫作作品集 2026–2027");
  pdf.setSubject("Chung Sing School creative writing anthology");
  pdf.setCreator("StorySeed Studio");
  pdf.setProducer("StorySeed Studio");
  pdf.setLanguage("zh-Hant");
  pdf.registerFontkit(fontkit as any);
  const fontBytes = await readFile(resolveCjkFontPath("Regular"));
  const boldBytes = await readFile(resolveCjkFontPath("Bold"));
  const regular = await pdf.embedFont(fontBytes, { subset: true });
  const bold = await pdf.embedFont(boldBytes, { subset: true });
  // Noto CJK also carries Latin glyphs, so every font in the file is embedded.
  // Standard PDF fonts are not embedded and can be substituted by printers.
  const english = regular;
  const englishBold = bold;

  const cover = pdf.addPage([pageWidth, pageHeight]);
  cover.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: paper });
  cover.drawRectangle({ x: 0, y: pageHeight - 190, width: pageWidth, height: 190, color: forest });
  cover.drawCircle({ x: pageWidth - 80, y: pageHeight - 100, size: 120, color: mint });
  cover.drawCircle({ x: pageWidth - 118, y: pageHeight - 137, size: 42, color: gold });
  drawSeed(cover, 116, pageHeight - 126, 1.6);
  cover.drawText("鍾聲學校", { x: margin, y: pageHeight - 82, size: 25, font: bold, color: white });
  cover.drawText("CHUNG SING SCHOOL", { x: margin + 2, y: pageHeight - 111, size: 10, font: englishBold, color: mint });
  cover.drawText("AI Creative Writing Class", { x: margin, y: pageHeight - 285, size: 17, font: englishBold, color: gold });
  cover.drawText("學生創意寫作作品集", { x: margin, y: pageHeight - 335, size: 34, font: bold, color: ink });
  cover.drawText("Stories that grow from a small idea", { x: margin, y: pageHeight - 371, size: 14, font: english, color: forest });
  cover.drawLine({ start: { x: margin, y: pageHeight - 412 }, end: { x: pageWidth - margin, y: pageHeight - 412 }, thickness: 1.2, color: gold });
  cover.drawText("2026–2027 School Year", { x: margin, y: 120, size: 13, font: englishBold, color: forest });
  cover.drawText("P5 · P6", { x: margin, y: 94, size: 12, font: english, color: gold });
  cover.drawText("StorySeed Studio", { x: pageWidth - 180, y: 94, size: 11, font: englishBold, color: forest });

  // Reserve contents pages up front, then fill them once piece start pages are known.
  const rowsPerContentsPage = 14;
  const contentsPageCount = Math.max(1, Math.ceil(items.length / rowsPerContentsPage));
  const contentsPages = Array.from({ length: contentsPageCount }, () => pdf.addPage([pageWidth, pageHeight]));

  const pieceStartPages: any[] = [];

  for (const item of items) {
    // First page of the piece carries the title block; continuations only carry the body.
    let page = pdf.addPage([pageWidth, pageHeight]);
    pieceStartPages.push(page);
    page.drawRectangle({ x: 0, y: pageHeight - 14, width: pageWidth, height: 14, color: forest });
    page.drawText(String(item.order).padStart(2, "0"), { x: margin, y: pageHeight - 75, size: 16, font: englishBold, color: gold });
    page.drawText(item.category ?? "Student Writing", { x: margin + 44, y: pageHeight - 72, size: 10, font: englishBold, color: forest });

    let titleSize = 26;
    let titleLines = wrapText(item.title, bold, titleSize, contentWidth);
    if (titleLines.length > 2) {
      titleSize = 18;
      titleLines = wrapText(item.title, bold, titleSize, contentWidth);
    }
    if (titleLines.length > 4) titleLines = titleLines.slice(0, 4);
    let titleY = pageHeight - 132;
    for (const line of titleLines) {
      page.drawText(line, { x: margin, y: titleY, size: titleSize, font: bold, color: ink });
      titleY -= titleSize + 8;
    }
    page.drawText(`${item.authorCode} · ${item.level}`, { x: margin, y: titleY - 4, size: 11, font: english, color: forest });
    page.drawLine({ start: { x: margin, y: titleY - 30 }, end: { x: pageWidth - margin, y: titleY - 30 }, thickness: 1, color: mint });

    let bodyY = titleY - 72;

    const addContinuationPage = () => {
      const next = pdf.addPage([pageWidth, pageHeight]);
      next.drawRectangle({ x: 0, y: pageHeight - 14, width: pageWidth, height: 14, color: forest });
      next.drawText(item.title, { x: margin, y: pageHeight - 66, size: 10, font: bold, color: forest });
      next.drawText("（續）", { x: pageWidth - margin - 30, y: pageHeight - 66, size: 10, font: regular, color: forest });
      next.drawLine({ start: { x: margin, y: pageHeight - 80 }, end: { x: pageWidth - margin, y: pageHeight - 80 }, thickness: 0.8, color: mint });
      bodyY = pageHeight - 116;
      return next;
    };

    for (const line of wrapText(item.body, regular, 13, contentWidth)) {
      if (bodyY < 150) {
        page = addContinuationPage();
      }
      if (line) page.drawText(line, { x: margin, y: bodyY, size: 13, font: regular, color: ink });
      bodyY -= line ? 22 : 12;
    }

    if (item.editorNote) {
      if (bodyY < 210) page = addContinuationPage();
      const noteLines = wrapText(`導師備註：${item.editorNote}`, regular, 9, contentWidth);
      for (const line of noteLines) {
        if (bodyY < 150) page = addContinuationPage();
        page.drawText(line, { x: margin, y: bodyY, size: 9, font: regular, color: forest });
        bodyY -= 14;
      }
      bodyY -= 8;
    }

    // Printed signature and date lines: students sign the physical copy.
    if (bodyY < 140) page = addContinuationPage();
    const labelY = bodyY - 12;
    const lineY = bodyY - 38;
    page.drawText("學生簽名 Student signature", { x: margin, y: labelY, size: 8, font: regular, color: forest });
    page.drawLine({ start: { x: margin, y: lineY }, end: { x: margin + 190, y: lineY }, thickness: 0.8, color: ink });
    page.drawText("日期 Date", { x: margin + 255, y: labelY, size: 8, font: regular, color: forest });
    page.drawLine({ start: { x: margin + 255, y: lineY }, end: { x: margin + 395, y: lineY }, thickness: 0.8, color: ink });
  }

  // Contents are drawn after pieces exist so each entry can show its page number.
  const pageNumberByPage = new Map<any, number>();
  pdf.getPages().forEach((page, index) => pageNumberByPage.set(page, index + 1));

  contentsPages.forEach((page, contentsIndex) => {
    page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: paper });
    if (contentsIndex === 0) {
      page.drawText("作品目錄", { x: margin, y: pageHeight - 88, size: 27, font: bold, color: forest });
      page.drawText("CONTENTS", { x: margin + 2, y: pageHeight - 111, size: 9, font: englishBold, color: gold });
    } else {
      page.drawText("作品目錄（續）", { x: margin, y: pageHeight - 88, size: 20, font: bold, color: forest });
    }
    page.drawLine({ start: { x: margin, y: pageHeight - 135 }, end: { x: pageWidth - margin, y: pageHeight - 135 }, thickness: 1, color: mint });
  });

  items.forEach((item, index) => {
    const page = contentsPages[Math.floor(index / rowsPerContentsPage)];
    const row = index % rowsPerContentsPage;
    const y = pageHeight - 180 - row * 40;
    page.drawText(String(item.order).padStart(2, "0"), { x: margin, y, size: 13, font: englishBold, color: gold });
    const titleLines = wrapText(item.title, bold, 12, 320).slice(0, 2);
    titleLines.forEach((line, lineIndex) => {
      page.drawText(line, { x: margin + 42, y: y - lineIndex * 15, size: 12, font: bold, color: ink });
    });
    page.drawText(`${item.authorCode} · ${item.level}`, { x: pageWidth - 175, y, size: 9, font: english, color: forest });
    const startPage = pieceStartPages[index];
    const startNumber = startPage ? pageNumberByPage.get(startPage) : undefined;
    if (startNumber) {
      page.drawText(String(startNumber), { x: pageWidth - margin - 8, y, size: 10, font: english, color: forest });
    }
  });

  const lastContentsPage = contentsPages[contentsPages.length - 1];
  lastContentsPage.drawText("每一篇作品都保留作者的原創聲音，並經過學生修訂及導師審閱。", { x: margin, y: 95, size: 11, font: regular, color: forest });

  // Footers and page numbers on every page except the cover.
  pdf.getPages().forEach((page, index) => {
    if (index === 0) return;
    page.drawText("StorySeed · Chung Sing School · 2026–2027", { x: margin, y: 28, size: 8, font: english, color: forest });
    page.drawText(String(index + 1), { x: pageWidth - margin - 12, y: 28, size: 8, font: englishBold, color: forest });
  });

  return Buffer.from(await pdf.save());
}
