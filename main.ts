// entry.ts — checks the finished front page and copies it to the grader's output.
// The image is drawn once (see work/render.html in the build folder) and shipped
// in this repo as entry.png; this program only verifies it is a real PNG inside
// the limits and copies it to /output. Node 22, standard library only, no network.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_BYTES = 1024 * 1024;
const MAX_SIDE = 1024;

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, 'entry.png');
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? 'out';
const target = join(outDir, 'entry.png');

const bytes = readFileSync(source);

if (!bytes.subarray(0, 8).equals(PNG_MAGIC)) {
  console.error('entry.png: not a PNG (bad 8-byte signature)');
  process.exit(1);
}
if (bytes.length > MAX_BYTES) {
  console.error(`entry.png: ${bytes.length} bytes exceeds the 1 MiB limit`);
  process.exit(1);
}
const width = bytes.readUInt32BE(16);
const height = bytes.readUInt32BE(20);
if (width > MAX_SIDE || height > MAX_SIDE) {
  console.error(`entry.png: ${width}x${height} exceeds the 1024x1024 limit`);
  process.exit(1);
}
// A whole PNG ends with its 12-byte IEND chunk (length + "IEND" + CRC),
// so the "IEND" type bytes sit 8 bytes before the end of the file.
const iend = Buffer.from([0x49, 0x45, 0x4e, 0x44]);
if (bytes.lastIndexOf(iend) !== bytes.length - 8) {
  console.error('entry.png: missing or misplaced IEND chunk (truncated file?)');
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
writeFileSync(target, bytes);
console.log(`entry.png: ${width}x${height}, ${bytes.length} bytes — copied to ${target}`);
