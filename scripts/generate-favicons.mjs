/**
 * Generate UGCFirst icon PNGs from SVG
 *
 * Usage: node scripts/generate-favicons.mjs
 */

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

async function generateIcons() {
  console.log('Generating UGCFirst icons...\n');

  const svgPath = join(publicDir, 'ugcfirst-icon.svg');
  const svgBuffer = readFileSync(svgPath);

  const sizes = [
    { size: 256, filename: 'icon-256.png' },
    { size: 1024, filename: 'icon-1024.png' },
  ];

  for (const { size, filename } of sizes) {
    const outputPath = join(publicDir, filename);

    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`✓ Generated ${filename} (${size}x${size})`);
  }

  console.log('\nDone!');
}

generateIcons().catch(console.error);
