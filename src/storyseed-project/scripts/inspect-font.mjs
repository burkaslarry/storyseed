import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const fontkit = require('fontkit');
const bytes = await readFile('/usr/share/fonts/opentype/noto/NotoSansCJKsc-Regular.otf');
const font = fontkit.create(bytes);
const subset = font.createSubset();
console.log({fontType: font.constructor?.name, subsetType: subset.constructor?.name, encodeStream: typeof subset.encodeStream, glyphs: typeof subset.includeGlyph});
