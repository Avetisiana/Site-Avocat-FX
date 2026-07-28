import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import path from 'path';

const dir = './brand_assets';
const files = await readdir(dir);
let total = 0, saved = 0;

for (const file of files) {
  if (!/\.webp$/i.test(file)) continue;
  const input  = path.join(dir, file);
  const stem   = file.replace(/\.webp$/i, '');
  const output = path.join(dir, stem + '.avif');
  const before = (await stat(input)).size;
  await sharp(input).avif({ quality: 62, effort: 6 }).toFile(output);
  const after = (await stat(output)).size;
  const pct = Math.round((1 - after / before) * 100);
  console.log(`${file} → ${stem}.avif  ${Math.round(before/1024)}KB → ${Math.round(after/1024)}KB  (${pct}% saving)`);
  total += before; saved += (before - after);
}
console.log(`\nTotal: ${Math.round(total/1024)}KB → ${Math.round((total-saved)/1024)}KB  (${Math.round(saved/1024)}KB saved)`);
