import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(__dirname, "..", "public");

function crc32(buf) {
  const table = crc32.table ?? (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function makePng(size) {
  const w = size, h = size;
  // Background: emerald (#10b981) with a white-ish dumbbell silhouette in the middle.
  const bg = [0x10, 0xb9, 0x81];
  const fg = [0xf5, 0xf5, 0xf4]; // stone-100

  const pixels = Buffer.alloc(w * h * 3);
  // fill bg
  for (let i = 0; i < pixels.length; i += 3) {
    pixels[i] = bg[0];
    pixels[i + 1] = bg[1];
    pixels[i + 2] = bg[2];
  }

  const cy = Math.floor(h / 2);
  const barY1 = cy - Math.floor(h * 0.06);
  const barY2 = cy + Math.floor(h * 0.06);
  const barX1 = Math.floor(w * 0.25);
  const barX2 = Math.floor(w * 0.75);

  const plateW = Math.floor(w * 0.10);
  const plateH = Math.floor(h * 0.34);
  const plateY1 = cy - Math.floor(plateH / 2);
  const plateY2 = cy + Math.floor(plateH / 2);

  function drawRect(x1, y1, x2, y2, c) {
    for (let y = Math.max(0, y1); y < Math.min(h, y2); y++) {
      for (let x = Math.max(0, x1); x < Math.min(w, x2); x++) {
        const idx = (y * w + x) * 3;
        pixels[idx] = c[0]; pixels[idx + 1] = c[1]; pixels[idx + 2] = c[2];
      }
    }
  }

  // Bar
  drawRect(barX1, barY1, barX2, barY2, fg);
  // Left plate
  drawRect(barX1 - plateW, plateY1, barX1, plateY2, fg);
  // Right plate
  drawRect(barX2, plateY1, barX2 + plateW, plateY2, fg);

  // Build raw scanlines with filter byte 0
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 3)] = 0;
    pixels.copy(raw, y * (1 + w * 3) + 1, y * w * 3, (y + 1) * w * 3);
  }
  const compressed = zlib.deflateSync(raw);

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", compressed), chunk("IEND", Buffer.alloc(0))]);
}

if (!fs.existsSync(PUBLIC)) fs.mkdirSync(PUBLIC, { recursive: true });
fs.writeFileSync(path.join(PUBLIC, "icon-192.png"), makePng(192));
fs.writeFileSync(path.join(PUBLIC, "icon-512.png"), makePng(512));
fs.writeFileSync(path.join(PUBLIC, "apple-touch-icon.png"), makePng(180));
console.log("[icons] Generated 192, 512, 180");
