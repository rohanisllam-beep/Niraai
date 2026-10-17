import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createPng(width, height, drawFn) {
  const rowBytes = width * 4 + 1;
  const rawData = Buffer.alloc(height * rowBytes);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // Signature
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdrLen = Buffer.alloc(4);
  ihdrLen.writeUInt32BE(13, 0);
  const ihdrType = Buffer.from('IHDR');
  const ihdrCrc = Buffer.alloc(4);
  ihdrCrc.writeUInt32BE(crc32(Buffer.concat([ihdrType, ihdrData])), 0);
  const ihdrChunk = Buffer.concat([ihdrLen, ihdrType, ihdrData, ihdrCrc]);

  // IDAT
  const idatLen = Buffer.alloc(4);
  idatLen.writeUInt32BE(deflated.length, 0);
  const idatType = Buffer.from('IDAT');
  const idatCrc = Buffer.alloc(4);
  idatCrc.writeUInt32BE(crc32(Buffer.concat([idatType, deflated])), 0);
  const idatChunk = Buffer.concat([idatLen, idatType, deflated, idatCrc]);

  // IEND
  const iendLen = Buffer.alloc(4);
  const iendType = Buffer.from('IEND');
  const iendCrc = Buffer.alloc(4);
  iendCrc.writeUInt32BE(crc32(iendType), 0);
  const iendChunk = Buffer.concat([iendLen, iendType, iendCrc]);

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// Arctic Silver Icon drawer
function drawArcticSilverIcon(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.hypot(dx, dy);
  const rMax = w / 2;

  // Background dark charcoal #050507
  let r = 5, g = 5, b = 7, a = 255;

  if (dist < rMax * 0.9) {
    // Ambient silver glow
    const glowT = Math.max(0, 1 - dist / (rMax * 0.9));
    r = Math.min(255, r + 58 * glowT);
    g = Math.min(255, g + 64 * glowT);
    b = Math.min(255, b + 82 * glowT);
  }

  // Silver Ring 1
  const ring1Dist = Math.abs(dist - rMax * 0.65);
  if (ring1Dist < 3.5) {
    const ringT = 1 - ring1Dist / 3.5;
    r = Math.round(r * (1 - ringT) + 208 * ringT);
    g = Math.round(g * (1 - ringT) + 218 * ringT);
    b = Math.round(b * (1 - ringT) + 234 * ringT);
  }

  // Silver Ring 2
  const ring2Dist = Math.abs(dist - rMax * 0.48);
  if (ring2Dist < 2.5) {
    const ringT = 1 - ring2Dist / 2.5;
    r = Math.round(r * (1 - ringT) + 186 * ringT);
    g = Math.round(g * (1 - ringT) + 176 * ringT);
    b = Math.round(b * (1 - ringT) + 236 * ringT);
  }

  // Central Silver Orb
  const orbRadius = rMax * 0.32;
  if (dist < orbRadius) {
    const orbT = 1 - dist / orbRadius;
    const highlight = Math.max(0, 1 - Math.hypot(dx + orbRadius * 0.3, dy + orbRadius * 0.3) / (orbRadius * 0.6));
    r = Math.round(58 + (208 - 58) * orbT + 47 * highlight);
    g = Math.round(64 + (218 - 64) * orbT + 37 * highlight);
    b = Math.round(82 + (234 - 82) * orbT + 21 * highlight);
  }

  return [Math.min(255, r), Math.min(255, g), Math.min(255, b), a];
}

const outDir = path.resolve('public');
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), createPng(192, 192, drawArcticSilverIcon));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), createPng(512, 512, drawArcticSilverIcon));
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), createPng(512, 512, drawArcticSilverIcon));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), createPng(180, 180, drawArcticSilverIcon));

console.log('Generated PNG icons successfully.');
