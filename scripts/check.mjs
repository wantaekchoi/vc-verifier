import { readFile } from 'node:fs/promises';
import { verifyCredential } from '../src/core/verify.js';
import { fromText } from '../src/inputs/extract.js';

const read = async (path) => JSON.parse(await readFile(path, 'utf8'));

const CASES = [
  ['valid credential', 'public/samples/genuine.json', 'pass'],
  ['evidence swapped', 'public/samples/tampered.json', 'fail'],
  ['cryptosuite not implemented', 'public/samples/unsupported.json', 'unsupported'],
  ['no key named', 'public/samples/no-fragment.json', 'unresolved'],
  ['plain VC, no Open Badges', 'public/samples/plain-vc.json', 'pass'],
];

let failed = 0;

const rejected = await verifyCredential(await read('public/samples/no-proof.json'))
  .then(() => false).catch(() => true);
console.log(`${rejected ? 'OK  ' : 'NG  '}${'no proof attached'.padEnd(28)} expected rejected -> ${rejected ? 'rejected' : 'attempted'}`);
if (!rejected) failed += 1;

for (const [name, path, expected] of CASES) {
  const { outcome } = await verifyCredential(await read(path));
  const ok = outcome === expected;
  if (!ok) failed += 1;
  console.log(`${ok ? 'OK  ' : 'NG  '}${name.padEnd(28)} expected ${expected} -> ${outcome}`);
}

const badge = await readFile('public/samples/genuine.svg', 'utf8').catch(() => null);
if (badge) {
  const { outcome } = await verifyCredential(fromText(badge));
  const ok = outcome === 'pass';
  if (!ok) failed += 1;
  console.log(`${ok ? 'OK  ' : 'NG  '}${'extracted from badge image'.padEnd(28)} expected pass -> ${outcome}`);
}

if (failed) {
  console.error(`\n${failed} case(s) did not match. A verifier that cannot verify does not ship.`);
  process.exit(1);
}
console.log('\nAll cases matched.');
