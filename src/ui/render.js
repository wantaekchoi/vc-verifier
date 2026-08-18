import { el, externalLink, infoMark, safeUrl, shortened, stateIcon } from './dom.js';
import { idOf, didWebDocumentUrl } from '../core/bindings.js';
import { supportedSuites } from '../core/suites.js';
import { TERMS } from './glossary.js';
import { evidenceList } from './evidence.js';

const STATE_OF = { pass: 'pass', fail: 'fail', unsupported: 'note', unresolved: 'note' };
const STATE_NAME = { pass: '일치', fail: '어긋남', note: '보류' };
const STAMP = {
  pass: '통과', fail: '어긋남', unsupported: '판정 안 함', unresolved: '판정 못 함',
};

const num = (value) => Number(value).toLocaleString('ko-KR');

const count = (value) => el('span', { class: 'num', text: num(value) });

const naming = (label) => (Array.isArray(label) ? label : [label, null]);

const named = (label) => {
  const [korean, spec] = naming(label);
  return spec
    ? [el('span', { class: 'name__ko', text: korean }),
       el('span', { class: 'spec', text: ` ${spec}` })]
    : [el('span', { class: 'name__ko', text: korean })];
};

const term = (key, label) => {
  const [korean, spec] = naming(label);
  return el('button', {
    class: 'term', type: 'button', popovertarget: `term-${key}`,
    'aria-label': `${korean}${spec ? ` ${spec}` : ''} — 설명 보기`,
  },
    el('span', { class: 'name__ko' }, korean, infoMark()),
    spec && el('span', { class: 'spec', text: ` ${spec}` }));
};

const termNote = ([key, { title, body, spec }]) =>
  el('div', { class: 'note', id: `term-${key}`, popover: 'auto' },
    el('p', { class: 'note__title' }, ...named(title)),
    el('p', { class: 'note__body', text: body }),
    externalLink(spec[1], { class: 'note__spec', text: spec[0] }));

const markBlock = (state, className = 'mark__icon') =>
  el('span', { class: `mark mark--${state}` },
    stateIcon(state, className),
    el('span', { class: 'mark__name', text: STATE_NAME[state] }));

const imageUrl = (node) => (typeof node === 'string' ? node : node?.id) ?? null;

const isMultibaseKey = (value) => /^z[1-9A-HJ-NP-Za-km-z]{40,}$/.test(value);

const valueBlock = (value) =>
  el('span', { class: isMultibaseKey(value) ? 'val val--key' : 'val', text: value });

const readableDate = (iso) => {
  if (!iso) return '—';
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime())
    ? iso
    : parsed.toLocaleString('ko-KR', { dateStyle: 'long', timeStyle: 'short' });
};

const panel = (name, { wide = false, role = 'detail' } = {}, ...children) =>
  el('section', { class: `panel panel--${role}${wide ? ' panel--wide' : ''}` },
    el(role === 'finding' ? 'h2' : 'h3', { class: 'panel__name', text: name }),
    ...children);

const comparisonRow = ({ label, left, right, state, detail, term: termKey }) => {
  const same = left === right;
  return el('tr', { class: `row row--${state}${same ? ' row--same' : ''}` },
    el('th', { class: 'row__label', scope: 'row' },
      termKey ? term(termKey, label) : el('span', {}, ...named(label))),
    el('td', { class: 'row__pair' },
      valueBlock(left),
      !same && valueBlock(right),
      state !== 'pass' && el('p', { class: 'row__detail', text: detail })),
    el('td', { class: 'row__mark' }, markBlock(state)));
};

const signatureLine = (result) => {
  const state = result.outcome === 'unsupported' ? 'note'
    : result.signature?.ok ? 'pass'
    : result.failure?.settles ? 'fail' : 'note';
  const detail = result.outcome === 'unsupported'
    ? `${result.declared} 방식을 다루지 않아 서명을 맞춰보지 못했다.`
    : result.signature?.ok ? null : result.failure.text;
  return el('tr', { class: `row sig sig--${state}` },
    el('th', { class: 'row__label', scope: 'row' }, term('cryptosuite', '서명')),
    el('td', { class: 'row__pair' },
      el('span', { class: 'val', text: result.suite?.label ?? result.declared }),
      detail && el('p', { class: 'row__detail', text: detail })),
    el('td', { class: 'row__mark' }, markBlock(state)));
};

const verdictHead = (result) => {
  const state = STATE_OF[result.outcome];
  return el('div', { class: 'band__head', role: 'status', 'aria-live': 'polite' },
    el('h1', { class: 'verdict' },
      stateIcon(state, 'verdict__icon'),
      el('span', { class: 'verdict__word', text: STAMP[result.outcome] })));
};

const verdictWhy = (result) => {
  if (result.failure) {
    return el('div', { class: 'band__why' },
      el('p', { class: 'verdict__why', text: result.failure.text }),
      el('details', { class: 'fold' },
        el('summary', { class: 'fold__summary', text: '원문' }),
        el('p', { class: 'val', text: result.failure.raw })));
  }
  if (result.outcome === 'unsupported') {
    return el('p', { class: 'verdict__why' },
      `이 크리덴셜이 쓴 서명 방식은 ${result.declared}이고, 여기서 다루는 것은 `,
      `${supportedSuites().map((s) => s.id).join(', ')}뿐이다.`);
  }
  return null;
};

const originalLink = (credential, source) => {
  const href = safeUrl(source) ?? safeUrl(credential.id);
  return href && externalLink(href, { class: 'subject__raw', text: '원본 JSON' });
};

const subjectBlock = (credential, backed, source) => {
  const achievement = credential.credentialSubject?.achievement;
  const issuer = credential.issuer;
  const badge = safeUrl(imageUrl(achievement?.image));
  const face = safeUrl(imageUrl(issuer?.image));
  const raw = originalLink(credential, source);

  return el('section', {
    class: `subject${badge ? ' subject--badged' : ''}${backed ? '' : ' subject--unbacked'}`,
  },
    !backed && el('p', { class: 'subject__caveat',
      text: '아래는 서명이 보증하지 않는다. 크리덴셜에 적힌 것을 그대로 옮겼을 뿐이다.' }),
    el('div', { class: 'subject__body' },
      el('h2', { class: 'subject__name',
        text: achievement?.name ?? '이름 없는 크리덴셜' }),
      el('p', { class: 'subject__by' },
        face && el('img', { class: 'subject__face', src: face, alt: '', width: '20', height: '20', loading: 'lazy' }),
        el('span', { text: '발급 ' }),
        safeUrl(issuer?.url)
          ? externalLink(safeUrl(issuer.url), { text: issuer.name ?? idOf(issuer) })
          : el('span', { text: issuer?.name ?? idOf(issuer) ?? '(발급자 없음)' }),
        raw && el('span', { class: 'subject__sep', text: '·' }),
        raw),
      achievement?.description &&
        el('p', { class: 'subject__desc', text: achievement.description }),
      achievement?.criteria?.narrative &&
        el('blockquote', { class: 'subject__criteria', text: achievement.criteria.narrative }),
      el('dl', { class: 'subject__dates' },
        el('dt', {}, ...named(['발급일', 'validFrom'])),
        el('dd', { text: readableDate(credential.validFrom ?? credential.issuanceDate) }),
        el('dt', {}, ...named(['만료', 'validUntil'])),
        el('dd', { text: credential.validUntil ? readableDate(credential.validUntil) : '없음' }))),
    badge &&
      el('img', { class: 'subject__badge', src: badge, alt: '', loading: 'lazy' }));
};

const publicKeyOf = (didDocument, method) =>
  (didDocument?.verificationMethod ?? [])
    .find((entry) => entry.id === method)?.publicKeyMultibase ?? null;

const identityPanel = (credential, proof, didDocument) => {
  const method = proof?.verificationMethod ?? '';
  const publicKey = publicKeyOf(didDocument, method);
  if (!publicKey) return null;
  const issuer = idOf(credential.issuer) ?? '';
  const source = issuer.startsWith('did:web:') ? didWebDocumentUrl(issuer) : null;

  return panel('신원', { wide: true },
    el('p', { class: 'fingerprint__label' },
      term('publickey', ['공개키', 'publicKeyMultibase'])),
    el('p', { class: 'fingerprint__value', text: publicKey }),
    el('p', { class: 'fingerprint__where' },
      '발급자가 ',
      source
        ? externalLink(source, { class: 'fingerprint__src', text: source })
        : el('span', { class: 'fingerprint__src', text: '자기 신원 문서' }),
      '에 공개해 둔 값이다. 서명은 이것으로 맞춰봤다.'));
};

const shareBlock = (target) => {
  const link = `${location.origin}${location.pathname}?vc=${encodeURIComponent(target)}`;
  const copy = el('button', {
    class: 'btn btn--quiet', type: 'button', text: '주소 복사',
    onclick: async (e) => {
      const button = e.currentTarget;
      button.classList.remove('is-done', 'is-failed');
      try {
        await navigator.clipboard.writeText(link);
        button.classList.add('is-done');
        button.setAttribute('aria-label', '주소 복사 — 복사됨');
      } catch {
        button.classList.add('is-failed');
        button.setAttribute('aria-label', '주소 복사 — 복사 못 함');
      }
    },
  });
  return el('div', { class: 'share' },
    el('p', { class: 'share__label', text: '이 결과를 그대로 여는 주소' }),
    el('div', { class: 'share__row' },
      externalLink(link, { class: 'share__url', text: link }),
      copy));
};

const sourcePanel = (credential, source) => {
  const fetched = safeUrl(source);
  const claimed = safeUrl(credential.id);
  if (!fetched && !claimed) return null;
  const shareable = fetched ?? claimed;
  return panel('원본', { wide: true },
    el('dl', { class: 'source__list' },
      fetched && el('dt', { text: '받아온 곳' }),
      fetched && el('dd', {}, externalLink(fetched, { class: 'source__url', text: fetched })),
      claimed && el('dt', { text: '크리덴셜이 밝힌 곳' }),
      claimed && el('dd', {},
        externalLink(claimed, { class: 'source__url', text: claimed }),
        el('span', { class: 'source__caveat',
          text: fetched === claimed
            ? ' — 받아온 곳과 같음.'
            : ' — 크리덴셜이 스스로 적은 값이라 여기서는 따로 확인하지 않음.' }))),
    shareable && shareBlock(shareable));
};

const fetchesPanel = (fetches) => {
  if (!fetches.length) return null;
  const counts = fetches.reduce((acc, f) => {
    acc[f.kind] = (acc[f.kind] ?? 0) + 1;
    return acc;
  }, {});
  return panel('참조', { wide: true },
    el('details', { class: 'fold' },
      el('summary', { class: 'fold__summary' },
        ...Object.entries(counts).flatMap(([kind, n], i) =>
          [i ? ' · ' : '', `${kind} `, count(n), '건'])),
      el('ul', { class: 'fetches__list' },
        ...fetches.map((f) =>
          el('li', { class: `fetch fetch--${f.ok ? 'ok' : 'failed'}` },
            el('span', { class: 'fetch__kind', text: f.kind }),
            el('span', { class: 'fetch__url', text: shortened(f.url, 44, 16) }),
            el('span', { class: 'fetch__ms', text: `${num(f.ms)}ms` }))))));
};

const evidencePanel = (evidence, backed) =>
  panel('근거', { wide: true, role: 'finding' },
    el('p', { class: 'fingerprint__label' }, term('evidence', ['증거', 'evidence'])),
    el('p', { class: 'panel__note' },
      count(evidence.length),
      backed
        ? '건이 서명 아래 들어 있다. 한 줄만 바꿔도 위 판정이 뒤집힌다.'
        : '건이지만 서명을 확인하지 못해 이 목록도 보증할 수 없다.'),
    evidenceList(evidence));

const comparisonPanel = (result, backed) =>
  panel('대조', { wide: true, role: 'finding' },
    el('p', { class: 'panel__note',
      text: backed
        ? '서명이 맞아도 그 키가 이 발급자 것인지는 따로 봐야 한다.'
        : '서명을 확인하지 못해 아래는 판정 근거가 아니다. 문서 안의 값끼리 맞는지만 본다.' }),
    el('table', { class: 'rows' },
      el('tbody', {},
        signatureLine(result),
        ...result.rows.map(comparisonRow))));

export function renderResult(result, source) {
  const { credential, proof, fetches, didDocument } = result;
  const evidence = Array.isArray(credential.evidence) ? credential.evidence : [];
  const backed = result.outcome === 'pass';

  return el('article', { class: 'console' },
    el('header', { class: `band band--${result.outcome}` },
      verdictHead(result),
      verdictWhy(result),
      subjectBlock(credential, backed, source)),
    el('div', { class: 'grid' },
      comparisonPanel(result, backed),
      identityPanel(credential, proof, didDocument),
      sourcePanel(credential, source),
      evidence.length ? evidencePanel(evidence, backed) : null,
      fetchesPanel(fetches)),
    el('p', { class: 'foot' },
      '검증에 ', count(result.ms), 'ms · 이 브라우저 안에서 처리했고 크리덴셜은 어디로도 나가지 않았다.'),
    ...Object.entries(TERMS).map(termNote));
}
