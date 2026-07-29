/**
 * Generates the PWA icon set from the campaign palette — no binary assets in
 * the repo, no image toolchain. Run with `npm run icons`.
 *
 * The mark is the signature element in miniature: the day count in
 * seven-segment bone over an ember bar that is visibly draining.
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

const VOID = [0x07, 0x08, 0x0a];
const GUNMETAL = [0x1a, 0x1d, 0x22];
const BONE = [0xe8, 0xe4, 0xda];
const EMBER = [0xff, 0x5a, 0x1f];

// ─── Minimal PNG writer (RGB, no alpha) ─────────────────────────────────────

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour
  const raw = Buffer.alloc(height * (width * 3 + 1));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 3 + 1);
    raw[rowStart] = 0; // filter: none
    pixels.copy(raw, rowStart + 1, y * width * 3, (y + 1) * width * 3);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ─── Canvas ─────────────────────────────────────────────────────────────────

function createCanvas(size, background) {
  const pixels = Buffer.alloc(size * size * 3);
  for (let i = 0; i < size * size; i++) {
    pixels[i * 3] = background[0];
    pixels[i * 3 + 1] = background[1];
    pixels[i * 3 + 2] = background[2];
  }

  const set = (x, y, color) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 3;
    pixels[i] = color[0];
    pixels[i + 1] = color[1];
    pixels[i + 2] = color[2];
  };

  const rect = (x, y, w, h, color, radius = 0) => {
    const x0 = Math.round(x);
    const y0 = Math.round(y);
    const x1 = Math.round(x + w);
    const y1 = Math.round(y + h);
    const r = Math.min(radius, (x1 - x0) / 2, (y1 - y0) / 2);
    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) {
        if (r > 0) {
          const dx = Math.max(x0 + r - px - 0.5, px + 0.5 - (x1 - r), 0);
          const dy = Math.max(y0 + r - py - 0.5, py + 0.5 - (y1 - r), 0);
          if (dx * dx + dy * dy > r * r) continue;
        }
        set(px, py, color);
      }
    }
  };

  return { pixels, rect };
}

// ─── Seven-segment digits ───────────────────────────────────────────────────

const SEGMENTS = {
  0: 'abcdef',
  1: 'bc',
  5: 'afgcd',
  8: 'abcdefg',
};

function drawDigit(canvas, digit, x, y, w, h, t, color) {
  const on = SEGMENTS[digit] ?? '';
  const k = t * 0.34; // segments reach past the joints so corners read closed
  const vh = (h - 3 * t) / 2 + 2 * k;
  const hw = w - 2 * t + 2 * k;
  const radius = t * 0.3;
  const draw = (seg, rx, ry, rw, rh) => {
    if (on.includes(seg)) canvas.rect(rx, ry, rw, rh, color, radius);
  };
  draw('a', x + t - k, y, hw, t);
  draw('b', x + w - t, y + t - k, t, vh);
  draw('c', x + w - t, y + 2 * t + (h - 3 * t) / 2 - k, t, vh);
  draw('d', x + t - k, y + h - t, hw, t);
  draw('e', x, y + 2 * t + (h - 3 * t) / 2 - k, t, vh);
  draw('f', x, y + t - k, t, vh);
  draw('g', x + t - k, y + (h - t) / 2, hw, t);
}

// ─── The mark ───────────────────────────────────────────────────────────────

function drawMark(size, scale) {
  const canvas = createCanvas(size, VOID);
  const s = size * scale;
  const originX = (size - s) / 2;
  const originY = (size - s) / 2;

  const digitH = s * 0.46;
  const digitW = digitH * 0.6;
  const thickness = digitH * 0.15;
  const gap = digitW * 0.24;
  const totalW = digitW * 3 + gap * 2;
  const startX = originX + (s - totalW) / 2;
  const digitY = originY + s * 0.16;

  [1, 5, 8].forEach((digit, i) => {
    drawDigit(
      canvas,
      digit,
      startX + i * (digitW + gap),
      digitY,
      digitW,
      digitH,
      thickness,
      BONE,
    );
  });

  // The bar drains: ember on the left, empty track on the right.
  const barY = originY + s * 0.74;
  const barH = s * 0.085;
  const barX = originX + s * 0.06;
  const barW = s * 0.88;
  canvas.rect(barX, barY, barW, barH, GUNMETAL, barH / 2);
  canvas.rect(barX, barY, barW * 0.58, barH, EMBER, barH / 2);

  return encodePng(size, size, canvas.pixels);
}

const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#07080A"/>
  <rect x="4" y="7" width="24" height="4" rx="2" fill="#E8E4DA"/>
  <rect x="4" y="15" width="24" height="4" rx="2" fill="#1A1D22"/>
  <rect x="4" y="15" width="14" height="4" rx="2" fill="#FF5A1F"/>
  <rect x="4" y="23" width="24" height="4" rx="2" fill="#1A1D22"/>
  <rect x="4" y="23" width="6" height="4" rx="2" fill="#FF5A1F"/>
</svg>
`;

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'icon-192.png'), drawMark(192, 0.86));
writeFileSync(join(OUT, 'icon-512.png'), drawMark(512, 0.86));
writeFileSync(join(OUT, 'icon-maskable-512.png'), drawMark(512, 0.62));
writeFileSync(join(OUT, 'favicon.svg'), FAVICON);

console.log('icons written to public/');
