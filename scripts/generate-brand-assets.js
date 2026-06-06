const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outDir = path.join(__dirname, '..', 'public');

const svg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#202327"/>
      <stop offset="1" stop-color="#181b1f"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="18" dy="18" stdDeviation="0" flood-color="#070809" flood-opacity=".72"/>
    </filter>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="10" flood-color="#000" flood-opacity=".28"/>
    </filter>
  </defs>

  <rect width="1024" height="1024" rx="132" fill="url(#bg)"/>
  <g opacity=".13" stroke="#34383e" stroke-width="22" fill="none">
    <path d="M-70 185c145 21 238 91 295 211 47 99 138 161 279 180 122 17 215 74 281 172"/>
    <path d="M118 -65c116 47 183 120 203 221 25 126 93 199 204 221 121 24 202 93 244 205"/>
    <path d="M432 -42c90 65 132 145 126 239-7 119 44 201 152 246 109 45 172 127 190 246"/>
    <path d="M-75 548c98-7 181 22 249 87 86 83 179 112 279 87 132-32 233-5 303 80"/>
  </g>

  <g filter="url(#soft)" stroke="#fff" stroke-width="78" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <path d="M182 759V415L494 155l346 300"/>
    <path d="M182 759H575"/>
  </g>

  <g filter="url(#shadow)" fill="#ff8636" stroke="#161719" stroke-width="15" stroke-linejoin="round">
    <path d="M260 704 355 358h142l78 346H443l-11-63H338l-20 63H260Zm99-166h58l-22-125h-4l-32 125Z"/>
    <path d="M500 704 552 358h132l-18 127h83l18-127h132l-52 346H715l20-134h-82l-20 134H500Z"/>
  </g>
</svg>`;

async function png(size, name) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(outDir, name));
}

function makeIco(pngBuffer) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0);
  entry.writeUInt8(32, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngBuffer.length, 8);
  entry.writeUInt32LE(22, 12);

  return Buffer.concat([header, entry, pngBuffer]);
}

async function main() {
  await fs.promises.mkdir(outDir, { recursive: true });
  await png(512, 'logo-mark.png');
  await png(512, 'icon-512.png');
  await png(512, 'maskable-icon.png');
  await png(192, 'icon-192.png');
  await png(180, 'apple-icon.png');
  await png(180, 'apple-touch-icon.png');
  await png(96, 'icon.png');
  await png(72, 'badge-72.png');

  const nestedIconDir = path.join(outDir, 'icons');
  await fs.promises.mkdir(nestedIconDir, { recursive: true });
  await sharp(Buffer.from(svg)).resize(192, 192).png().toFile(path.join(nestedIconDir, 'icon.png'));

  const faviconPng = await sharp(Buffer.from(svg)).resize(32, 32).png().toBuffer();
  await fs.promises.writeFile(path.join(outDir, 'favicon.ico'), makeIco(faviconPng));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
