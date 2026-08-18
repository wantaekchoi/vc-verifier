import { readFile } from 'node:fs/promises';
import { verifyCredential } from '../src/core/verify.js';
import { fromText } from '../src/inputs/extract.js';

const read = async (path) => JSON.parse(await readFile(path, 'utf8'));

const CASES = [
  ['valid credential', 'public/samples/genuine.json', 'pass', 'pass'],
  ['evidence swapped', 'public/samples/tampered.json', 'fail', 'pass'],
  ['cryptosuite not implemented', 'public/samples/unsupported.json', 'unsupported', 'pass'],
  ['no key named', 'public/samples/no-fragment.json', 'unresolved', 'pass'],
  ['plain VC, no Open Badges', 'public/samples/plain-vc.json', 'pass', 'absent'],
];

const schemaState = (schemas) =>
  (schemas === null || schemas === undefined ? 'absent' : schemas.map((e) => e.state).join(','));

let failed = 0;

const rejected = await verifyCredential(await read('public/samples/no-proof.json'))
  .then(() => false).catch(() => true);
console.log(`${rejected ? 'OK  ' : 'NG  '}${'no proof attached'.padEnd(28)} expected rejected -> ${rejected ? 'rejected' : 'attempted'}`);
if (!rejected) failed += 1;

for (const [name, path, expected, expectedSchema] of CASES) {
  const result = await verifyCredential(await read(path));
  const schema = schemaState(result.schemas);
  const ok = result.outcome === expected && schema === expectedSchema;
  if (!ok) failed += 1;
  console.log(`${ok ? 'OK  ' : 'NG  '}${name.padEnd(28)} expected ${expected}/${expectedSchema} -> ${result.outcome}/${schema}`);
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
