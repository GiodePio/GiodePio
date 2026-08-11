const fs = require('fs');
const crypto = require('crypto');

function patchClassWithUUID(classBuffer, uuid) {
  const buf = Buffer.from(classBuffer);
  const searchStr = 'unknown';
  
  if (uuid.length > 255) throw new Error('UUID too long for constant pool');
  
  // Find CONSTANT_Utf8 entries with value "unknown" (length 7)
  const positions = [];
  let i = 0;
  while (i < buf.length - 10) {
    if (buf[i] === 0x01) { // CONSTANT_Utf8 tag
      const len = buf.readUInt16BE(i + 1);
      if (len === 7 && buf.slice(i + 3, i + 10).toString('ascii') === searchStr) {
        positions.push({ offset: i, oldLen: len });
      }
    }
    i++;
  }
  
  if (positions.length === 0) throw new Error('No "unknown" found');
  
  // Build new buffer
  let result = Buffer.alloc(0);
  let lastEnd = 0;
  
  for (const pos of positions) {
    result = Buffer.concat([result, buf.slice(lastEnd, pos.offset)]);
    // Write: tag(1) + new length(2) + uuid string
    const tagBuf = Buffer.from([0x01]);
    const lenBuf = Buffer.alloc(2);
    lenBuf.writeUInt16BE(uuid.length);
    const strBuf = Buffer.from(uuid, 'ascii');
    result = Buffer.concat([result, tagBuf, lenBuf, strBuf]);
    lastEnd = pos.offset + 1 + 2 + pos.oldLen; // skip old tag + length + "unknown"
  }
  result = Buffer.concat([result, buf.slice(lastEnd)]);
  
  return result;
}

// Export for use in API
module.exports = { patchClassWithUUID };

if (require.main === module) {
  const classPath = process.argv[2];
  const uuid = process.argv[3] || crypto.randomUUID();
  
  const classData = fs.readFileSync(classPath);
  const patched = patchClassWithUUID(classData, uuid);
  
  const outPath = process.argv[4] || classPath;
  fs.writeFileSync(outPath, patched);
  console.log(`Patched with UUID: ${uuid} (${classData.length} -> ${patched.length} bytes)`);
}
