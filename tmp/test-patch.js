const JSZip = require('jszip');
const fs = require('fs');
const crypto = require('crypto');

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
  if (positions.length === 0) { console.log('NO POSITIONS FOUND'); return buf; }
  console.log('Found', positions.length, 'positions to patch');
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

async function test() {
  const jar = await fs.promises.readFile('public/mods/consentmod-1.0.0.jar');
  const zip = await JSZip.loadAsync(jar);
  const entry = zip.file('com/consentmod/ModConfig.class');
  const classData = await entry.async('nodebuffer');
  
  const testUUID = crypto.randomUUID();
  console.log('Test UUID:', testUUID);
  
  const patched = patchClassWithUUID(classData, testUUID);
  
  const patchedStr = patched.toString('latin1');
  const hasUUID = patchedStr.includes(testUUID);
  const hasPlaceholder = patchedStr.includes('PLACEHOLDER_UUID');
  console.log('UUID present after patch:', hasUUID);
  console.log('PLACEHOLDER still present:', hasPlaceholder);
  
  // Also check what the string constant looks like before patching
  const beforeStr = classData.toString('latin1');
  const idx = beforeStr.indexOf('PLACEHOLDER_UUID');
  console.log('\nBefore patch - string at offset:', idx);
  console.log('Bytes around string:');
  for (let j = idx - 5; j < idx + 20; j++) {
    process.stdout.write('0x' + classData[j].toString(16).padStart(2, '0') + ' ');
  }
  console.log();
}

test().catch(console.error);
