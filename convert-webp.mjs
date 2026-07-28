import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import path from 'path';

const dir = './brand_assets';
const files = await readdir(dir);

for (const file of files) {
  if (/\.(png|jpe?g)$/i.test(file)) {
    const input = path.join(dir, file);
    const stem = file.replace(/\.(png|jpe?g)$/i, '');
    const output = path.join(dir, stem + '.webp');
    await sharp(input).webp({ quality: 82 }).toFile(output);
    const { size: inSize } = await stat(input);
    const { size: outSize } = await stat(output);
    const pct = Math.round((1 - outSize / inSize) * 100);
    console.log(`${file}: ${(inSize/1024).toFixed(0)}KB → ${(outSize/1024).toFixed(0)}KB WebP (−${pct}%)`);
  }
}
console.log('\nDone! All images converted to WebP.');
