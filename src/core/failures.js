const KNOWN = [
  {
    test: /invalid signature/i,
    settles: true,
    text: 'The signature does not match this document. Either the content changed after signing, or the proof came from a different document.',
  },
  {
    test: /not authorized by controller/i,
    settles: true,
    text: 'The signing key is not registered for assertions. The DID document does not authorise it for this use.',
  },
  {
    test: /publicKeyMultibase.*required|no public key|key.*not found/i,
    settles: false,
    text: 'verificationMethod names no single key, so there was no way to decide which key to check against. '
      + 'Verifiers that accept identity-only references would pass this credential.',
  },
  {
    test: /verification method.*(not found|could not be)|dereference/i,
    settles: false,
    text: 'That key is not in the DID document.',
  },
  {
    test: /safe mode|context.*(not allowed|url)|dropping property|term.*not defined/i,
    settles: false,
    text: 'This credential uses a JSON-LD context that is not bundled here. Without the definitions, there is no way to tell what the signature covers.',
  },
  {
    test: /failed to fetch|network|load.*document/i,
    settles: false,
    text: 'A document needed for verification could not be fetched.',
  },
];

export function explainFailure(message = '') {
  const known = KNOWN.find((entry) => entry.test.test(message));
  return known
    ? { text: known.text, settles: known.settles, raw: message }
    : { text: 'Verification did not finish.', settles: false, raw: message };
}
