import { DataIntegrityProof } from '@digitalbazaar/data-integrity';
import { cryptosuite as eddsaRdfc2022 } from '@digitalbazaar/eddsa-rdfc-2022-cryptosuite';

export const SUITES = [
  {
    id: 'eddsa-rdfc-2022',
    label: 'Ed25519 signature · RDF canonicalisation',
    match: (proof) =>
      proof?.type === 'DataIntegrityProof' && proof?.cryptosuite === 'eddsa-rdfc-2022',
    make: () => new DataIntegrityProof({ cryptosuite: eddsaRdfc2022 }),
  },
];

export const firstProof = (credential) =>
  Array.isArray(credential?.proof) ? credential.proof[0] : credential?.proof;

export const findSuite = (proof) => SUITES.find((s) => s.match(proof)) ?? null;

export const supportedSuites = () => SUITES.map(({ id, label }) => ({ id, label }));
