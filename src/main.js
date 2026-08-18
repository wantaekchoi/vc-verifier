import { verifyCredential } from './core/verify.js';
import { fromFile, fromText, fromUrl } from './inputs/extract.js';
import { renderResult } from './ui/render.js';
import { renderInput } from './ui/input.js';
import { logResult } from './ui/console-log.js';
import { clear, el, externalLink, repoMark } from './ui/dom.js';

const REPO = 'https://github.com/wantaekchoi/vc-verifier';

const app = document.querySelector('#app');
const state = { busy: false, result: null, error: null, url: '', text: '', source: null };

const credentialUrlFromLocation = () => {
  const direct = new URLSearchParams(location.search).get('vc');
  if (direct) return direct;
  const [, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
  return new URLSearchParams(query).get('vc');
};

const checkedAt = () =>
  new Date().toLocaleString('ko-KR', { dateStyle: 'long', timeStyle: 'short' });

const header = () =>
  el('header', { class: 'masthead' },
    el('p', { class: 'masthead__title', text: '크리덴셜 검증' }),
    el('p', { class: 'masthead__line',
      text: '서명이 맞는지 확인하고 무엇을 보고 그렇게 판정했는지도 함께 보여준다.' }),
    el('p', { class: 'masthead__stamp' },
      el('span', { class: 'masthead__stampLabel', text: '대조 시각 ' }),
      el('time', { datetime: new Date().toISOString(), text: checkedAt() }),
      externalLink(REPO, { class: 'masthead__repo', 'aria-label': '이 페이지의 소스' },
        repoMark())));

const onChange = (patch) => Object.assign(state, patch);

const BASE_TITLE = '크리덴셜 검증';

function retitle() {
  const name = state.result?.credential?.credentialSubject?.achievement?.name;
  const verdict = state.result && {
    pass: '통과', fail: '어긋남', unsupported: '판정 안 함', unresolved: '판정 못 함',
  }[state.result.outcome];
  document.title = name && verdict
    ? `${name} — ${verdict} · ${BASE_TITLE}`
    : BASE_TITLE;
}

function paint({ focusResult = false } = {}) {
  const parts = [
    header(),
    el('main', { class: 'outcome' },
      state.busy ? el('p', { class: 'working', text: '대조 중' }) : null,
      state.error
        ? el('section', { class: 'trouble', tabindex: '-1' },
            el('h1', { class: 'trouble__name', text: '읽지 못했다' }),
            el('p', { class: 'trouble__line', text: state.error }))
        : null,
      state.result ? renderResult(state.result, state.source) : null),
    renderInput({
      onUrl: run(fromUrl), onText: run(fromText), onFile: run(fromFile),
      onChange, busy: state.busy, values: { url: state.url, text: state.text },
    }),
  ];
  clear(app).append(...parts.filter(Boolean));
  retitle();

  if (focusResult) {
    const landing = app.querySelector('.band, .trouble');
    if (landing) {
      landing.setAttribute('tabindex', '-1');
      landing.focus({ preventScroll: true });
      if (window.scrollY > 0) landing.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }
}

const run = (load) => async (source) => {
  state.busy = true;
  state.error = null;
  state.source = typeof source === 'string' && /^https?:/.test(source) ? source : null;
  paint();
  try {
    state.result = await verifyCredential(await load(source));
    logResult(state.result);
  } catch (e) {
    state.result = null;
    state.error = e.message;
  } finally {
    state.busy = false;
    paint({ focusResult: true });
  }
};

paint();

const fromLink = credentialUrlFromLocation();
if (fromLink) {
  state.url = fromLink;
  run(fromUrl)(fromLink);
}
