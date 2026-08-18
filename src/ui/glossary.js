export const TERMS = {
  didweb: {
    title: ['did:web', null],
    body: 'An identity whose address is a domain. For did:web:example.com the public keys live in a document at example.com/.well-known/did.json. Whoever controls that address is that identity.',
    spec: ['did:web Method Specification', 'https://w3c-ccg.github.io/did-method-web/'],
  },
  publickey: {
    title: ['publicKeyMultibase', '공개키'],
    body: 'The value a signature is checked against. The issuer publishes it in its own DID document and signs with the matching private key. Checking the signature against it is one question; whether the key really belongs to the issuer is the separate one answered under Bindings.',
    spec: ['Multikey (Controlled Identifiers)', 'https://www.w3.org/TR/cid-1.0/#multikey'],
  },
  assertion: {
    title: ['assertionMethod', '서명용 키'],
    body: 'A DID document states what each key is for. A key published only for authentication can still produce a valid signature, but the issuer never authorised it to make claims.',
    spec: ['DID Core · assertionMethod', 'https://www.w3.org/TR/did-core/#assertion'],
  },
  cryptosuite: {
    title: ['cryptosuite', '서명 방식'],
    body: 'The rule set for how a document is put in order and which algorithm signs it. Change the suite and the same document gets a different signature. A verifier can only check the suites it implements.',
    spec: ['Data Integrity EdDSA Cryptosuites', 'https://www.w3.org/TR/vc-di-eddsa/'],
  },
  fragment: {
    title: ['fragment', '프래그먼트'],
    body: 'did:web:example.com names one identity; did:web:example.com#key-1 names one key inside it. A signature is checked against a key, so the part after # decides which key that is.',
    spec: ['DID URL Syntax', 'https://www.w3.org/TR/did-core/#did-url-syntax'],
  },
  evidence: {
    title: ['evidence', '근거'],
    body: 'A property of the VC Data Model, not of Open Badges. It records what the issuer relied on when making the claim. The signature covers this list, so changing one line breaks it.',
    spec: ['VC Data Model · evidence', 'https://www.w3.org/TR/vc-data-model-2.0/#evidence'],
  },
};
