import { Buffer } from 'node:buffer';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { deflateSync } from 'node:zlib';

const CRC_TABLE = createCrcTable();
const rootDir = process.cwd();
const outputs = [
  ['public/icons/icon-16.png', createIcon(16)],
  ['public/icons/icon-32.png', createIcon(32)],
  ['public/icons/icon-48.png', createIcon(48)],
  ['public/icons/icon-128.png', createIcon(128)],
  ['store-assets/icon-128.png', createIcon(128)],
  ['store-assets/promo-tile-440x280.png', createPromoTile()],
  ['store-assets/screenshot-sidebar-1280x800.png', createSidebarScreenshot()],
  ['store-assets/screenshot-settings-1280x800.png', createSettingsScreenshot()],
];

for (const [relativePath, image] of outputs) {
  const outputPath = path.join(rootDir, relativePath);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, encodePng(image));
}

console.log(`Generated ${outputs.length} Chrome Web Store asset files.`);

function createIcon(size) {
  const image = createImage(size, size, '#0f172a');

  fillVerticalGradient(image, 0, 0, size, size, '#0f172a', '#0e7490');
  roundRect(image, size * 0.17, size * 0.26, size * 0.66, size * 0.5, size * 0.1, '#f8fafc');
  roundRect(image, size * 0.2, size * 0.18, size * 0.32, size * 0.18, size * 0.08, '#f8fafc');
  roundRect(image, size * 0.27, size * 0.38, size * 0.46, size * 0.08, size * 0.03, '#0f766e');
  roundRect(image, size * 0.27, size * 0.52, size * 0.34, size * 0.08, size * 0.03, '#38bdf8');

  return image;
}

function createPromoTile() {
  const image = createImage(440, 280, '#f8fafc');

  fillVerticalGradient(image, 0, 0, 440, 280, '#f8fafc', '#dff7f2');
  roundRect(image, 34, 34, 156, 156, 24, '#0f172a');
  roundRect(image, 62, 78, 100, 74, 12, '#f8fafc');
  roundRect(image, 70, 64, 48, 28, 10, '#f8fafc');
  roundRect(image, 220, 56, 170, 18, 9, '#0f172a');
  roundRect(image, 220, 92, 132, 12, 6, '#64748b');
  roundRect(image, 220, 122, 104, 12, 6, '#64748b');
  roundRect(image, 220, 178, 148, 42, 10, '#0f766e');
  roundRect(image, 246, 193, 96, 12, 6, '#ecfeff');

  return image;
}

function createSidebarScreenshot() {
  const image = createImage(1280, 800, '#f8fafc');

  browserFrame(image);
  chatCanvas(image, 84, 106, 760, 610);
  sidePanel(image, 884, 106, 312, 610);

  return image;
}

function createSettingsScreenshot() {
  const image = createImage(1280, 800, '#f8fafc');

  browserFrame(image);
  roundRect(image, 100, 112, 1080, 588, 18, '#ffffff');
  roundRect(image, 138, 150, 210, 18, 9, '#0f172a');
  roundRect(image, 138, 184, 360, 10, 5, '#94a3b8');

  for (let index = 0; index < 4; index += 1) {
    const top = 240 + index * 94;

    roundRect(image, 138, top, 192, 14, 7, '#334155');
    roundRect(image, 138, top + 28, 136, 9, 5, '#94a3b8');
    roundRect(image, 380, top - 10, 708, 70, 12, '#f8fafc');
    roundRect(image, 410, top + 12, 198, 12, 6, '#0f172a');
    roundRect(image, 410, top + 36, 420, 9, 5, '#94a3b8');
    roundRect(image, 1008, top + 8, 54, 24, 12, index === 1 ? '#0f766e' : '#cbd5e1');
  }

  return image;
}

function browserFrame(image) {
  roundRect(image, 48, 42, 1184, 696, 28, '#e2e8f0');
  roundRect(image, 48, 42, 1184, 72, 28, '#0f172a');
  roundRect(image, 92, 68, 16, 16, 8, '#ef4444');
  roundRect(image, 124, 68, 16, 16, 8, '#f59e0b');
  roundRect(image, 156, 68, 16, 16, 8, '#22c55e');
  roundRect(image, 228, 64, 760, 24, 12, '#334155');
}

function chatCanvas(image, left, top, width, height) {
  roundRect(image, left, top, width, height, 18, '#ffffff');
  roundRect(image, left + 44, top + 46, 320, 16, 8, '#0f172a');
  roundRect(image, left + 44, top + 88, 560, 12, 6, '#94a3b8');
  roundRect(image, left + 44, top + 120, 470, 12, 6, '#cbd5e1');

  for (let index = 0; index < 4; index += 1) {
    const rowTop = top + 196 + index * 92;

    roundRect(image, left + 44, rowTop, 612, 58, 14, index % 2 === 0 ? '#eefdf8' : '#f1f5f9');
    roundRect(image, left + 72, rowTop + 18, 290 + index * 38, 10, 5, '#64748b');
    roundRect(image, left + 72, rowTop + 36, 180 + index * 28, 8, 4, '#cbd5e1');
  }
}

function sidePanel(image, left, top, width, height) {
  roundRect(image, left, top, width, height, 18, '#0f172a');
  roundRect(image, left + 28, top + 34, 168, 14, 7, '#f8fafc');
  roundRect(image, left + 28, top + 70, 240, 34, 10, '#1e293b');

  for (let index = 0; index < 5; index += 1) {
    const rowTop = top + 142 + index * 74;

    roundRect(image, left + 28, rowTop, 256, 48, 12, index === 0 ? '#0f766e' : '#1e293b');
    roundRect(image, left + 48, rowTop + 16, 136 + index * 12, 8, 4, '#f8fafc');
    roundRect(image, left + 48, rowTop + 31, 82, 6, 3, '#94a3b8');
  }
}

function createImage(width, height, background) {
  const image = {
    data: new Uint8Array(width * height * 4),
    height,
    width,
  };

  rect(image, 0, 0, width, height, background);

  return image;
}

function fillVerticalGradient(image, left, top, width, height, from, to) {
  const start = parseColor(from);
  const end = parseColor(to);

  for (let y = Math.floor(top); y < Math.ceil(top + height); y += 1) {
    const amount = (y - top) / Math.max(height - 1, 1);
    const color = [
      Math.round(start[0] + (end[0] - start[0]) * amount),
      Math.round(start[1] + (end[1] - start[1]) * amount),
      Math.round(start[2] + (end[2] - start[2]) * amount),
      255,
    ];

    for (let x = Math.floor(left); x < Math.ceil(left + width); x += 1) {
      setPixel(image, x, y, color);
    }
  }
}

function rect(image, left, top, width, height, colorValue) {
  const color = parseColor(colorValue);

  for (let y = Math.floor(top); y < Math.ceil(top + height); y += 1) {
    for (let x = Math.floor(left); x < Math.ceil(left + width); x += 1) {
      setPixel(image, x, y, color);
    }
  }
}

function roundRect(image, left, top, width, height, radius, colorValue) {
  const color = parseColor(colorValue);
  const right = left + width;
  const bottom = top + height;

  for (let y = Math.floor(top); y < Math.ceil(bottom); y += 1) {
    for (let x = Math.floor(left); x < Math.ceil(right); x += 1) {
      const dx = Math.max(left + radius - x, 0, x - (right - radius));
      const dy = Math.max(top + radius - y, 0, y - (bottom - radius));

      if (dx * dx + dy * dy <= radius * radius) {
        setPixel(image, x, y, color);
      }
    }
  }
}

function setPixel(image, x, y, color) {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) {
    return;
  }

  const offset = (Math.floor(y) * image.width + Math.floor(x)) * 4;
  image.data[offset] = color[0];
  image.data[offset + 1] = color[1];
  image.data[offset + 2] = color[2];
  image.data[offset + 3] = color[3];
}

function parseColor(value) {
  const normalized = value.replace('#', '');

  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
    255,
  ];
}

function encodePng(image) {
  const raw = Buffer.alloc((image.width * 4 + 1) * image.height);

  for (let y = 0; y < image.height; y += 1) {
    const rowStart = y * (image.width * 4 + 1);

    raw[rowStart] = 0;
    raw.set(image.data.subarray(y * image.width * 4, (y + 1) * image.width * 4), rowStart + 1);
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', createIhdr(image.width, image.height)),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function createIhdr(width, height) {
  const buffer = Buffer.alloc(13);

  buffer.writeUInt32BE(width, 0);
  buffer.writeUInt32BE(height, 4);
  buffer[8] = 8;
  buffer[9] = 6;
  buffer[10] = 0;
  buffer[11] = 0;
  buffer[12] = 0;

  return buffer;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const lengthBuffer = Buffer.alloc(4);
  const crcBuffer = Buffer.alloc(4);

  lengthBuffer.writeUInt32BE(data.length, 0);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);

  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function createCrcTable() {
  const table = [];

  for (let index = 0; index < 256; index += 1) {
    let value = index;

    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }

    table[index] = value >>> 0;
  }

  return table;
}
