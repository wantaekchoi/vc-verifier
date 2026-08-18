import { el, externalLink, infoMark, safeUrl, shortened, stateIcon } from './dom.js';
import { idOf, didWebDocumentUrl } from '../core/bindings.js';
import { supportedSuites } from '../core/suites.js';
import { TERMS } from './glossary.js';
import { evidenceList } from './evidence.js';

const STATE_OF = { pass: 'pass', fail: 'fail', unsupported: 'note', unresolved: 'note' };
const STATE_NAME = { pass: 'match', fail: 'mismatch', note: 'unchecked' };
const STAMP = {
  pass: ['PASS', '통과'],
  fail: ['MISMATCH', '어긋남'],
  unsupported: ['NOT JUDGED', '판정 안 함'],
  unresolved: ['CANNOT JUDGE', '판정 못 함'],
};

const num = (value) => Number(value).toLocaleString('en-GB');

const count = (value) => el('span', { class: 'num', text: num(value) });

const naming = (label) => (Array.isArray(label) ? label : [label, null]);

const named = (label) => {
  const [term, alt] = naming(label);
  return alt
    ? [el('span', { class: 'label__term', text: term }),
       el('span', { class: 'label__alt', text: ` ${alt}` })]
    : [el('span', { class: 'label__term', text: term })];
};

const term = (key, label) => {
  const [name, alt] = naming(label);
  return el('button', {
    class: 'term', type: 'button', popovertarget: `term-${key}`,
    'aria-label': `${name}${alt ? ` ${alt}` : ''} — what this means`,
  },
    el('span', { class: 'label__term' }, name, infoMark()),
    alt && el('span', { class: 'label__alt', text: ` ${alt}` }));
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
    : parsed.toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' });
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
    ? `This verifier does not implement ${result.declared}, so the signature was never checked.`
    : result.signature?.ok ? null : result.failure.text;
  return el('tr', { class: `row sig sig--${state}` },
    el('th', { class: 'row__label', scope: 'row' }, term('cryptosuite', 'signature')),
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
      el('span', { class: 'verdict__word' },
        el('span', { class: 'verdict__en', text: STAMP[result.outcome][0] }),
        ' ',
        el('span', { class: 'verdict__ko', text: STAMP[result.outcome][1] }))));
};

const verdictWhy = (result) => {
  if (result.failure) {
    return el('div', { class: 'band__why' },
      el('p', { class: 'verdict__why', text: result.failure.text }),
      el('details', { class: 'fold' },
        el('summary', { class: 'fold__summary', text: 'library message' }),
        el('p', { class: 'val', text: result.failure.raw })));
  }
  if (result.outcome === 'unsupported') {
    return el('p', { class: 'verdict__why' },
      `This credential is signed with ${result.declared}. `,
      `The only suites implemented here are ${supportedSuites().map((s) => s.id).join(', ')}.`);
  }
  return null;
};

const originalLink = (credential, source) => {
  const href = safeUrl(source) ?? safeUrl(credential.id);
  return href && externalLink(href, { class: 'subject__raw', text: 'raw JSON' });
};

const typeLabel = (credential) => {
  const types = [].concat(credential.type ?? []).filter((t) => t !== 'VerifiableCredential');
  return types.length ? types.join(' · ') : null;
};

export const credentialLabel = (credential) => subjectOf(credential).name;

const subjectOf = (credential) => {
  const achievement = credential.credentialSubject?.achievement;
  return {
    name: achievement?.name ?? credential.name ?? typeLabel(credential),
    description: achievement?.description ?? credential.description ?? null,
    criteria: achievement?.criteria?.narrative ?? null,
    image: achievement?.image ?? null,
  };
};

const subjectBlock = (credential, backed, source) => {
  const subject = subjectOf(credential);
  const issuer = credential.issuer;
  const badge = safeUrl(imageUrl(subject.image));
  const face = safeUrl(imageUrl(issuer?.image));
  const raw = originalLink(credential, source);

  return el('section', {
    class: `subject${badge ? ' subject--badged' : ''}${backed ? '' : ' subject--unbacked'}`,
  },
    !backed && el('p', { class: 'subject__caveat',
      text: 'The signature does not vouch for anything below. These values are copied from the credential as written.' }),
    el('div', { class: 'subject__body' },
      el('h2', { class: 'subject__name',
        text: subject.name ?? 'Unnamed credential' }),
      el('p', { class: 'subject__by' },
        face && el('img', { class: 'subject__face', src: face, alt: '', width: '20', height: '20', loading: 'lazy' }),
        el('span', { text: 'issued by ' }),
        safeUrl(issuer?.url)
          ? externalLink(safeUrl(issuer.url), { text: issuer.name ?? idOf(issuer) })
          : el('span', { text: issuer?.name ?? idOf(issuer) ?? '(no issuer)' }),
        raw && el('span', { class: 'subject__sep', text: '·' }),
        raw),
      subject.description &&
        el('p', { class: 'subject__desc', text: subject.description }),
      subject.criteria &&
        el('blockquote', { class: 'subject__criteria', text: subject.criteria }),
      el('dl', { class: 'subject__dates' },
        el('dt', {}, ...named(['validFrom', '발급일'])),
        el('dd', { text: readableDate(credential.validFrom ?? credential.issuanceDate) }),
        el('dt', {}, ...named(['validUntil', '만료'])),
        el('dd', { text: credential.validUntil ? readableDate(credential.validUntil) : 'none' }))),
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

  return panel('Key', { wide: true },
    el('p', { class: 'fingerprint__label' },
      term('publickey', ['publicKeyMultibase', '공개키'])),
    el('p', { class: 'fingerprint__value', text: publicKey }),
    el('p', { class: 'fingerprint__where' },
      'The issuer publishes this value in ',
      source
        ? externalLink(source, { class: 'fingerprint__src', text: source })
        : el('span', { class: 'fingerprint__src', text: 'its own DID document' }),
      '. The signature was checked against it.'));
};

const shareBlock = (target) => {
  const link = `${location.origin}${location.pathname}?vc=${encodeURIComponent(target)}`;
  const copy = el('button', {
    class: 'btn btn--quiet', type: 'button', text: 'copy link',
    onclick: async (e) => {
      const button = e.currentTarget;
      button.classList.remove('is-done', 'is-failed');
      try {
        await navigator.clipboard.writeText(link);
        button.classList.add('is-done');
        button.setAttribute('aria-label', 'copy link — copied');
      } catch {
        button.classList.add('is-failed');
        button.setAttribute('aria-label', 'copy link — failed');
      }
    },
  });
  return el('div', { class: 'share' },
    el('p', { class: 'share__label', text: 'Link that reopens this result' }),
    el('div', { class: 'share__row' },
      externalLink(link, { class: 'share__url', text: link }),
      copy));
};

const sourcePanel = (credential, source) => {
  const fetched = safeUrl(source);
  const claimed = safeUrl(credential.id);
  if (!fetched && !claimed) return null;
  const shareable = fetched ?? claimed;
  return panel('Source', { wide: true },
    el('dl', { class: 'source__list' },
      fetched && el('dt', { text: 'fetched from' }),
      fetched && el('dd', {}, externalLink(fetched, { class: 'source__url', text: fetched })),
      claimed && el('dt', { text: 'claimed by the credential' }),
      claimed && el('dd', {},
        externalLink(claimed, { class: 'source__url', text: claimed }),
        el('span', { class: 'source__caveat',
          text: fetched === claimed
            ? ', the same address it was fetched from.'
            : ', written by the credential itself and not checked here.' }))),
    shareable && shareBlock(shareable));
};

const schemaPanel = (schemas) => {
  if (!schemas?.length) return null;
  return panel('Schema', { wide: true },
    el('p', { class: 'panel__note',
      text: 'The credential names a schema its shape should follow. This is a separate question from the signature and does not change the verdict above.' }),
    el('table', { class: 'rows' },
      el('tbody', {},
        ...schemas.map((entry) =>
          el('tr', { class: `row row--${entry.state}` },
            el('th', { class: 'row__label', scope: 'row' },
              ...named(['credentialSchema', '스키마'])),
            el('td', { class: 'row__pair' },
              entry.type && el('p', { class: 'val', text: entry.type }),
              el('p', { class: 'val val--url', text: entry.id ?? '(none)' }),
              el('p', { class: 'row__detail', text: entry.detail })),
            el('td', { class: 'row__mark' }, markBlock(entry.state)))))));
};

const fetchesPanel = (fetches) => {
  if (!fetches.length) return null;
  const counts = fetches.reduce((acc, f) => {
    acc[f.kind] = (acc[f.kind] ?? 0) + 1;
    return acc;
  }, {});
  return panel('Fetched', { wide: true },
    el('details', { class: 'fold' },
      el('summary', { class: 'fold__summary' },
        ...Object.entries(counts).flatMap(([kind, n], i) =>
          [i ? ' · ' : '', count(n), ` ${kind}`])),
      el('ul', { class: 'fetches__list' },
        ...fetches.map((f) =>
          el('li', { class: `fetch fetch--${f.ok ? 'ok' : 'failed'}` },
            el('span', { class: 'fetch__kind', text: f.kind }),
            el('span', { class: 'fetch__url', text: shortened(f.url, 44, 16) }),
            el('span', { class: 'fetch__ms', text: `${num(f.ms)}ms` }))))));
};

const evidencePanel = (evidence, backed) =>
  panel('Evidence', { wide: true, role: 'finding' },
    el('p', { class: 'fingerprint__label' }, term('evidence', ['evidence', '증거'])),
    el('p', { class: 'panel__note' },
      count(evidence.length),
      backed
        ? ' entries sit under the signature. Change one line and the verdict above flips.'
        : ' entries, but the signature could not be checked, so this list is not vouched for either.'),
    evidenceList(evidence));

const comparisonPanel = (result, backed) =>
  panel('Bindings', { wide: true, role: 'finding' },
    el('p', { class: 'panel__note',
      text: backed
        ? 'A valid signature still leaves one question: does that key belong to this issuer?'
        : 'The signature could not be checked, so nothing below settles the verdict. It only compares values inside the document.' }),
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
      schemaPanel(result.schemas),
      fetchesPanel(fetches)),
    el('p', { class: 'foot' },
      'Verified in ', count(result.ms), ' ms, inside this browser. The credential was never sent anywhere.'),
    ...Object.entries(TERMS).map(termNote));
}
