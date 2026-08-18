import * as vc from '@digitalbazaar/vc';
import { securityLoader } from '@digitalcredentials/security-document-loader';
import { findSuite, firstProof } from './suites.js';
import { bindingRows, didWebDocumentUrl, idOf } from './bindings.js';
import { explainFailure } from './failures.js';
import { checkSchemas } from './schema.js';

const kindOfUrl = (url) =>
  url.startsWith('did:') ? 'DID document'
  : /schema|context|\.jsonld$/.test(url) ? 'context'
  : 'document';

function recordingLoader(record) {
  const load = securityLoader({ fetchRemoteContexts: false }).build();
  const already = new Set();
  return async (url) => {
    const started = performance.now();
    const note = (extra) => {
      if (already.has(url)) return;
      already.add(url);
      record({ url, kind: kindOfUrl(url), ms: Math.round(performance.now() - started), ...extra });
    };
    try {
      const result = await load(url);
      note({ ok: true, document: result.document });
      return result;
    } catch (e) {
      note({ ok: false, error: e.message });
      throw e;
    }
  };
}

async function checkSignature(credential, suite, documentLoader) {
  try {
    const result = await vc.verifyCredential({ credential, suite: suite.make(), documentLoader });
    if (result.verified === true) return { ok: true, error: null };
    const errors = result.error?.errors ?? (result.error ? [result.error] : []);
    return {
      ok: false,
      error: errors.map((e) => e?.message).filter(Boolean).join(' / ') || 'The signature does not match.',
    };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function issuerDocument(issuer, fetches) {
  const seen = fetches.find((f) => f.ok && f.document?.id === issuer)?.document;
  if (seen) return seen;
  if (!issuer?.startsWith('did:web:')) return null;

  const url = didWebDocumentUrl(issuer);
  const started = performance.now();
  const note = (extra) =>
    fetches.push({ url, kind: 'DID document', ms: Math.round(performance.now() - started), ...extra });
  try {
    const response = await fetch(url);
    if (!response.ok) { note({ ok: false, error: `HTTP ${response.status}` }); return null; }
    const document = await response.json();
    note({ ok: true, document });
    return document.id === issuer ? document : null;
  } catch (e) {
    note({ ok: false, error: e.message });
    return null;
  }
}

const outcomeOf = ({ signature, rows, failure }) => {
  if (!signature.ok) return failure.settles ? 'fail' : 'unresolved';
  return rows.some((r) => r.state === 'fail') ? 'fail' : 'pass';
};

export async function verifyCredential(credential) {
  const proof = firstProof(credential);
  if (!proof) {
    throw new Error('No proof is attached. This is not a credential that can be verified.');
  }
  const suite = findSuite(proof);
  const fetches = [];

  if (!suite) {
    const didDocument = await issuerDocument(idOf(credential.issuer), fetches);
    return {
      outcome: 'unsupported',
      declared: proof?.cryptosuite ?? proof?.type ?? '(no proof)',
      credential, proof, suite: null, fetches, didDocument, ms: 0,
      schemas: await checkSchemas(credential, (f) => fetches.push(f)),
      rows: bindingRows({ credential, didDocument, signatureConfirmed: false }),
    };
  }

  const documentLoader = recordingLoader((f) => fetches.push(f));
  const started = performance.now();
  const signature = await checkSignature(credential, suite, documentLoader);
  const ms = Math.round(performance.now() - started);

  const issuer = idOf(credential.issuer);
  const didDocument = await issuerDocument(issuer, fetches);
  const failure = signature.ok ? null : explainFailure(signature.error);
  const rows = bindingRows({ credential, didDocument, signatureConfirmed: signature.ok });
  const schemas = await checkSchemas(credential, (f) => fetches.push(f));

  return {
    outcome: outcomeOf({ signature, rows, failure }),
    credential, proof, signature, failure, rows, fetches, ms, didDocument, schemas,
    suite: { id: suite.id, label: suite.label },
  };
}
