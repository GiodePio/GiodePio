const fs = require('fs');

function patchClassWithUUID(classBuffer, uuid) {
  const buf = Buffer.from(classBuffer);
  const searchStr = 'PLACEHOLDER_UUID';
  const searchBytes = Buffer.from(searchStr, 'ascii');
  
  const positions = [];
  let i = 0;
  while (i < buf.length - searchBytes.length - 3) {
    if (buf[i] === 0x01) {
      const len = buf.readUInt16BE(i + 1);
      if (len === searchBytes.length && buf.slice(i + 3, i + 3 + len).equals(searchBytes)) {
        positions.push({ offset: i, oldLen: len });
      }
    }
    i++;
  }
  
  if (positions.length === 0) throw new Error('PLACEHOLDER_UUID not found in class file');

  let result = Buffer.alloc(0);
  let lastEnd = 0;
  for (const pos of positions) {
    result = Buffer.concat([result, buf.slice(lastEnd, pos.offset)]);
    const tagBuf = Buffer.from([0x01]);
    const lenBuf = Buffer.alloc(2);
    lenBuf.writeUInt16BE(uuid.length);
    const strBuf = Buffer.from(uuid, 'ascii');
    result = Buffer.concat([result, tagBuf, lenBuf, strBuf]);
    lastEnd = pos.offset + 1 + 2 + pos.oldLen;
  }
  result = Buffer.concat([result, buf.slice(lastEnd)]);
  return result;
}

module.exports = { patchClassWithUUID };

if (require.main === module) {
  const classPath = process.argv[2];
  const uuid = process.argv[3];
  const outPath = process.argv[4] || classPath;
  
  const classData = fs.readFileSync(classPath);
  const patched = patchClassWithUUID(classData, uuid);
  fs.writeFileSync(outPath, patched);
  console.log(`Patched with UUID: ${uuid}`);
}
