import { firstProof } from './suites.js';

export const idOf = (node) => (node && typeof node === 'object' ? node.id : node);

export const didWebToOrigin = (did) =>
  'https://' +
  decodeURIComponent(did.slice('did:web:'.length).split('#')[0].replace(/:/g, '/'));

export const didWebDocumentUrl = (did) =>
  didWebToOrigin(did) +
  (did.slice('did:web:'.length).split('#')[0].includes(':')
    ? '/did.json'
    : '/.well-known/did.json');

const row = (id, label, left, right, state, detail, term = null, unbacked = null) =>
  ({ id, label, left, right, state, detail, term, unbacked });

const listed = (values) => (values.length ? values.join('\n') : '(empty)');

const signingKeyBelongsToIssuer = (issuer, keyHolder) =>
  issuer && keyHolder
    ? row('key-owner', ['issuer', '발급자'], issuer, keyHolder,
        issuer === keyHolder ? 'pass' : 'fail',
        issuer === keyHolder
          ? 'The issuer named by the credential and the holder of the signing key are the same.'
          : 'The credential names one issuer, but the signature uses a key held by someone else.',
        issuer.startsWith('did:web:') ? 'didweb' : null,
        'The holder of the signing key is the issuer written in the document.')
    : row('key-owner', ['issuer', '발급자'], issuer ?? '(none)', keyHolder || '(none)',
        'fail', 'issuer or verificationMethod is missing.');

const keyIsInDocument = (didDocument, method) => {
  const keys = (didDocument.verificationMethod ?? []).map((entry) => entry.id ?? idOf(entry));
  const found = keys.includes(method);
  return row('key-pointer', ['verificationMethod', '검증방법'], method || '(none)', listed(keys),
    found ? 'pass' : 'fail',
    found
      ? 'The signing key was found in the DID document as written.'
      : 'The signing key appears nowhere in the DID document.',
    'fragment',
    'The signature points at a key listed in the DID document.');
};

const documentDescribesIssuer = (didDocument, issuer) =>
  row('did-subject', ['id', '신원 문서'], didDocument.id ?? '(none)', issuer,
    didDocument.id === issuer ? 'pass' : 'fail',
    didDocument.id === issuer
      ? 'The document fetched from the issuer describes that issuer itself.'
      : 'The fetched document describes someone else.',
    null,
    'The fetched document described that issuer.');

const keyIsRegisteredForSigning = (didDocument, method, keyHolder) => {
  const registered = (didDocument.assertionMethod ?? []).map(idOf);
  const ok = registered.some((entry) => entry === method || entry?.split('#')[0] === keyHolder);
  return row('key-purpose', ['assertionMethod', '서명용 키'], method || '(none)', listed(registered),
    ok ? 'pass' : 'fail',
    ok
      ? 'The DID document lists this key under assertionMethod.'
      : 'This key is missing from assertionMethod. It may have been published for authentication only.',
    'assertion',
    'The DID document says this key is for signing assertions.');
};

const withoutDocument = (method, issuer) => [
  row('key-pointer', ['verificationMethod', '검증방법'], method || '(none)', 'unknown', 'note',
    'The issuer DID document could not be fetched, so it is unknown whether this key is in it.', 'fragment'),
  row('did-subject', ['id', '신원 문서'], 'unknown', issuer || '(none)', 'note',
    'No document was fetched, so there is nothing to compare.'),
  row('key-purpose', ['assertionMethod', '서명용 키'], method || '(none)', 'unknown', 'note',
    'The assertionMethod list itself could not be read.', 'assertion'),
];

const noFragment = (method) =>
  row('key-pointer', ['verificationMethod', '검증방법'], method || '(none)', 'identity only', 'note',
    'verificationMethod points at the identity but not at a specific key. This verifier looked up that identity\u2019s assertion key, but other verifiers reject the form.',
    'fragment');

const demoted = (r) =>
  (r.state === 'pass' ? { ...r, state: 'note', detail: r.unbacked ?? r.detail } : r);

export function bindingRows({ credential, didDocument, signatureConfirmed = true }) {
  const method = firstProof(credential)?.verificationMethod ?? '';
  const keyHolder = method.split('#')[0];
  const issuer = idOf(credential.issuer);

  const rows = [signingKeyBelongsToIssuer(issuer, keyHolder)];

  if (!method.includes('#')) rows.push(noFragment(method));

  if (didDocument) {
    if (method.includes('#')) rows.push(keyIsInDocument(didDocument, method));
    rows.push(documentDescribesIssuer(didDocument, issuer));
    rows.push(keyIsRegisteredForSigning(didDocument, method, keyHolder));
  } else {
    rows.push(...withoutDocument(method, issuer));
  }

  return signatureConfirmed ? rows : rows.map(demoted);
}
