import { el } from './dom.js';

export function renderInput({ onUrl, onText, onFile, onChange, busy, values }) {
  const url = el('input', {
    class: 'field', type: 'url', id: 'vc-url',
    autocomplete: 'off', spellcheck: 'false', disabled: busy,
    value: values.url,
    oninput: (e) => onChange({ url: e.target.value }),
  });
  const text = el('textarea', {
    class: 'field field--area', id: 'vc-text', rows: '4', disabled: busy,
    oninput: (e) => onChange({ text: e.target.value }),
  });
  text.value = values.text;

  const file = el('input', {
    class: 'file', type: 'file', id: 'vc-file', disabled: busy,
    tabindex: '-1', 'aria-hidden': 'true',
    accept: '.json,.jsonld,.svg,application/json,image/svg+xml',
    onchange: (e) => e.target.files[0] && onFile(e.target.files[0]),
  });

  const submitUrl = (e) => { e.preventDefault(); url.value.trim() && onUrl(url.value.trim()); };
  const submitText = (e) => { e.preventDefault(); text.value.trim() && onText(text.value); };

  const drop = el('div', { class: 'intake panel' },
    el('h2', { class: 'panel__name', text: 'Input' }),
    el('form', { class: 'intake__row', onsubmit: submitUrl },
      el('label', { class: 'intake__label', for: 'vc-url', text: 'address' }),
      url,
      el('button', { class: 'btn', type: 'submit', disabled: busy, text: 'verify' })),
    el('form', { class: 'intake__row intake__row--stack', onsubmit: submitText },
      el('label', { class: 'intake__label', for: 'vc-text',
        text: 'paste JSON · drop a badge image' }),
      text,
      el('div', { class: 'intake__actions' },
        el('button', {
          class: 'btn btn--quiet', type: 'button', disabled: busy, text: 'open file',
          onclick: () => file.click(),
        }),
        file,
        el('button', { class: 'btn', type: 'submit', disabled: busy, text: 'verify' }))),
    el('p', { class: 'intake__note',
      text: 'Only the address route needs the other server to allow the request. Pasting and files do not.' }));

  const swallow = (e) => { e.preventDefault(); };
  drop.addEventListener('dragover', swallow);
  drop.addEventListener('drop', (e) => {
    swallow(e);
    const dropped = e.dataTransfer?.files?.[0];
    if (dropped) onFile(dropped);
  });
  return drop;
}
