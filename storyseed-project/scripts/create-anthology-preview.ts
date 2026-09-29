import { readFile, writeFile } from 'node:fs/promises';
import { buildAnthologyPdf } from '../server/anthologyPdf';

const files = ['p6-01-an-unlucky-day.txt', 'p6-02-my-hero.txt', 'p6-03-my-hero.txt'];
const items = [];
for (let index = 0; index < files.length; index += 1) {
  const text = await readFile(`/home/ubuntu/chung-sing-ai-writing/test-samples/${files[index]}`, 'utf8');
  const lines = text.split('\n');
  const code = lines[0].split(':')[1].trim();
  const title = lines[2].split(':')[1].trim();
  const body = text.split('\n\n').slice(1).join('\n\n');
  items.push({ order: index + 1, authorCode: code, title, level: 'P6' as const, category: 'Student Writing', body, editorNote: '匿名化測試預覽；正式版本由導師確認出版文字。' });
}
const pdf = await buildAnthologyPdf(items);
await writeFile('/home/ubuntu/anthology-preview-chung-sing-2026.pdf', pdf);
console.log('/home/ubuntu/anthology-preview-chung-sing-2026.pdf');
