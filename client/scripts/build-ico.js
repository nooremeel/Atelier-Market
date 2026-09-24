import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');

const sizes = [16, 32, 48];
const images = sizes.map(s => {
  const filePath = path.join(publicDir, `icon-${s}.png`);
  const data = fs.readFileSync(filePath);
  return {
    size: s,
    data,
    byteLength: data.length
  };
});

const headerLength = 6;
const dirEntryLength = 16;
let currentOffset = headerLength + (dirEntryLength * images.length);

const header = Buffer.alloc(headerLength);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type 1 = ICO
header.writeUInt16LE(images.length, 4); // count

const dirEntries = [];
const imageBuffers = [];

for (const img of images) {
  const entry = Buffer.alloc(dirEntryLength);
  entry.writeUInt8(img.size === 256 ? 0 : img.size, 0); // width
  entry.writeUInt8(img.size === 256 ? 0 : img.size, 1); // height
  entry.writeUInt8(0, 2); // color count
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(img.byteLength, 8); // size of image data
  entry.writeUInt32LE(currentOffset, 12); // offset
  
  dirEntries.push(entry);
  imageBuffers.push(img.data);
  currentOffset += img.byteLength;
}

const icoBuffer = Buffer.concat([header, ...dirEntries, ...imageBuffers]);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
console.log('Successfully created favicon.ico with sizes: 16x16, 32x32, 48x48');
