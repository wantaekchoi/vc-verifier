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

const listed = (values) => (values.length ? values.join('\n') : '(비어 있음)');

const signingKeyBelongsToIssuer = (issuer, keyHolder) =>
  issuer && keyHolder
    ? row('key-owner', ['발급자', 'issuer'], issuer, keyHolder,
        issuer === keyHolder ? 'pass' : 'fail',
        issuer === keyHolder
          ? '크리덴셜이 밝힌 발급자와 서명이 가리키는 키의 주인이 같음.'
          : '크리덴셜은 한쪽을 발급자라 하는데 서명은 다른 쪽 키로.',
        issuer.startsWith('did:web:') ? 'didweb' : null,
        '서명이 가리키는 키의 주인이 곧 문서에 적힌 발급자다.')
    : row('key-owner', ['발급자', 'issuer'], issuer ?? '(없음)', keyHolder || '(없음)',
        'fail', '발급자나 검증방법이 비어 있음.');

const keyIsInDocument = (didDocument, method) => {
  const keys = (didDocument.verificationMethod ?? []).map((entry) => entry.id ?? idOf(entry));
  const found = keys.includes(method);
  return row('key-pointer', ['검증방법', 'verificationMethod'], method || '(없음)', listed(keys),
    found ? 'pass' : 'fail',
    found
      ? '서명에 쓴 키를 신원 문서에서 그대로 찾았다.'
      : '서명에 쓴 키가 신원 문서 어디에도 없다.',
    'fragment',
    '신원 문서에 올라와 있는 키를 서명이 가리킨다.');
};

const documentDescribesIssuer = (didDocument, issuer) =>
  row('did-subject', ['신원 문서', 'id'], didDocument.id ?? '(없음)', issuer,
    didDocument.id === issuer ? 'pass' : 'fail',
    didDocument.id === issuer
      ? '발급자를 찾아가 받아온 문서에 적힌 주체가 그 발급자 자신.'
      : '받아온 문서가 기술하는 대상이 다른 쪽이다.',
    null,
    '받아온 문서가 기술하는 대상이 그 발급자였다.');

const keyIsRegisteredForSigning = (didDocument, method, keyHolder) => {
  const registered = (didDocument.assertionMethod ?? []).map(idOf);
  const ok = registered.some((entry) => entry === method || entry?.split('#')[0] === keyHolder);
  return row('key-purpose', ['서명용 키', 'assertionMethod'], method || '(없음)', listed(registered),
    ok ? 'pass' : 'fail',
    ok
      ? '신원 문서가 이 키를 주장 서명용으로 올려둠.'
      : '주장 서명용 목록에 이 키가 빠져 있다. 로그인 확인에만 쓰라고 올린 키일지 모른다.',
    'assertion',
    '이 키가 주장 서명용이라고 신원 문서에 적혀 있다.');
};

const withoutDocument = (method, issuer) => [
  row('key-pointer', ['검증방법', 'verificationMethod'], method || '(없음)', '미확인', 'note',
    '발급자의 신원 문서를 받아오지 못해 이 키가 거기 있는지는 미확인.', 'fragment'),
  row('did-subject', ['신원 문서', 'id'], '미확인', issuer || '(없음)', 'note',
    '받아온 문서가 없으니 대조할 것도 없다.'),
  row('key-purpose', ['서명용 키', 'assertionMethod'], method || '(없음)', '미확인', 'note',
    '주장 서명용 목록 자체를 읽지 못했다.', 'assertion'),
];

const noFragment = (method) =>
  row('key-pointer', ['검증방법', 'verificationMethod'], method || '(없음)', '신원', 'note',
    '검증방법이 신원까지만 가리킬 뿐 어느 키인지는 적혀 있지 않다. 그 신원의 서명용 키를 찾아 검증했지만 이를 거부하는 검증기도 있다.',
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
