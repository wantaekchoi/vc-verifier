export const TERMS = {
  didweb: {
    title: ['did:web', null],
    body: '신원을 도메인 주소로 삼는 방식. did:web:example.com 이면 example.com 의 /.well-known/did.json 에 놓인 문서에 그 신원의 공개키가 적혀 있다. 그 주소를 통제하는 쪽이 곧 그 신원이다.',
    spec: ['did:web Method Specification', 'https://w3c-ccg.github.io/did-method-web/'],
  },
  publickey: {
    title: ['공개키', 'publicKeyMultibase'],
    body: '서명을 확인할 때 쓰는 값이다. 발급자는 이 값을 자기 신원 문서에 공개해 두고 서명은 그 짝이 되는 비밀키로 만든다. 여기 적힌 값으로 서명을 맞춰보되 정말 발급자 것인지는 아래 대조에서 가릴 문제다.',
    spec: ['Multikey (Controlled Identifiers)', 'https://www.w3.org/TR/cid-1.0/#multikey'],
  },
  assertion: {
    title: ['서명용 키', 'assertionMethod'],
    body: '신원 문서에는 키마다 쓰임이 따로 적혀 있다. 로그인 확인에만 쓰라고 올린 키로 주장에 서명하면 그 서명이 맞아도 발급자가 허락한 용도가 아니다.',
    spec: ['DID Core · assertionMethod', 'https://www.w3.org/TR/did-core/#assertion'],
  },
  cryptosuite: {
    title: ['서명 방식', 'cryptosuite'],
    body: '문서를 어떤 순서로 정리해 어떤 알고리즘으로 서명할지 정해 둔 규약이다. 방식이 다르면 같은 문서라도 서명이 달라진다. 검증기는 자기가 아는 방식만 맞춰볼 수 있다.',
    spec: ['Data Integrity EdDSA Cryptosuites', 'https://www.w3.org/TR/vc-di-eddsa/'],
  },
  fragment: {
    title: ['프래그먼트', 'fragment'],
    body: 'did:web:example.com 은 신원 하나를 가리키고 did:web:example.com#key-1 은 그 신원의 특정 키를 가리킨다. 서명은 키로 맞춰보는 것이라 # 뒤까지 적혀 있어야 어느 키인지 정해진다.',
    spec: ['DID URL Syntax', 'https://www.w3.org/TR/did-core/#did-url-syntax'],
  },
  evidence: {
    title: ['근거', 'evidence'],
    body: '배지가 무엇을 두고 발급됐는지 적은 목록이다. 이 목록까지 서명이 덮어서 어느 한 줄만 고쳐도 서명이 맞지 않는다.',
    spec: ['VC Data Model · evidence', 'https://www.w3.org/TR/vc-data-model-2.0/#evidence'],
  },
};
