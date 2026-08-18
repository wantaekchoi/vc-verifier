import { readFile } from 'node:fs/promises';
import { verifyCredential } from '../src/core/verify.js';
import { fromText } from '../src/inputs/extract.js';

const read = async (path) => JSON.parse(await readFile(path, 'utf8'));

const CASES = [
  ['정상 크리덴셜', 'public/samples/genuine.json', 'pass'],
  ['증거를 바꿔치기한 것', 'public/samples/tampered.json', 'fail'],
  ['다루지 않는 서명 방식', 'public/samples/unsupported.json', 'unsupported'],
  ['키를 지정하지 않은 것', 'public/samples/no-fragment.json', 'unresolved'],
];

let failed = 0;

const rejected = await verifyCredential(await read('public/samples/no-proof.json'))
  .then(() => false).catch(() => true);
console.log(`${rejected ? 'OK  ' : 'NG  '}${'서명이 없는 문서'.padEnd(20)} 읽지 못함 기대 → ${rejected ? '읽지 못함' : '검증 시도'}`);
if (!rejected) failed += 1;

for (const [name, path, expected] of CASES) {
  const { outcome } = await verifyCredential(await read(path));
  const ok = outcome === expected;
  if (!ok) failed += 1;
  console.log(`${ok ? 'OK  ' : 'NG  '}${name.padEnd(20)} ${expected} 기대 → ${outcome}`);
}

const badge = await readFile('public/samples/genuine.svg', 'utf8').catch(() => null);
if (badge) {
  const { outcome } = await verifyCredential(fromText(badge));
  const ok = outcome === 'pass';
  if (!ok) failed += 1;
  console.log(`${ok ? 'OK  ' : 'NG  '}${'배지 이미지에서 꺼낸 것'.padEnd(20)} pass 기대 → ${outcome}`);
}

if (failed) {
  console.error(`\n${failed}건이 기대와 다르다. 검증하지 못하는 검증기를 배포할 수 없다.`);
  process.exit(1);
}
console.log('\n전부 기대대로다.');
