import { writeFile } from 'node:fs/promises';
import * as Ed25519Multikey from '@digitalbazaar/ed25519-multikey';
import { DataIntegrityProof } from '@digitalbazaar/data-integrity';
import { cryptosuite as eddsaRdfc2022 } from '@digitalbazaar/eddsa-rdfc-2022-cryptosuite';
import { securityLoader } from '@digitalcredentials/security-document-loader';
import * as vc from '@digitalbazaar/vc';

const SEED = new Uint8Array(32).fill(7);
const OUT = 'public/samples/plain-vc.json';

const key = await Ed25519Multikey.generate({ seed: SEED });
const did = `did:key:${key.publicKeyMultibase}`;
key.id = `${did}#${key.publicKeyMultibase}`;
key.controller = did;

const credential = {
  '@context': ['https://www.w3.org/ns/credentials/v2'],
  id: 'https://wantaekchoi.github.io/vc-verifier/samples/plain-vc.json',
  type: ['VerifiableCredential'],
  name: 'Plain Verifiable Credential',
  description:
    'A W3C Verifiable Credentials 2.0 credential that uses no Open Badges vocabulary. '
    + 'It has no achievement, so a viewer that reads only Open Badges fields shows it as unnamed.',
  issuer: did,
  validFrom: '2026-08-01T00:00:00Z',
  credentialSubject: {
    id: 'https://wantaekchoi.github.io/',
  },
};

const signed = await vc.issue({
  credential,
  suite: new DataIntegrityProof({ signer: key.signer(), cryptosuite: eddsaRdfc2022 }),
  documentLoader: securityLoader({ fetchRemoteContexts: false }).build(),
});

await writeFile(OUT, JSON.stringify(signed, null, 2) + '\n');
console.log(`${OUT}\nissuer ${did}`);
