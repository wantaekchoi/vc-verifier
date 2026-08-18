import { el, externalLink, safeUrl, shortened } from './dom.js';

const labelOf = (item) =>
  item.name ?? (typeof item.id === 'string' ? shortened(item.id, 40, 16) : '(unnamed)');

const textOf = (item) => item.description ?? item.narrative ?? '';

const entry = (item, index) => {
  const href = safeUrl(item.id);
  return el('li', { class: 'item' },
    el('span', { class: 'item__no', text: `${index + 1}. ` }),
    el('span', { class: 'item__main' },
      href
        ? externalLink(href, { class: 'item__ref' }, labelOf(item))
        : el('span', { class: 'item__ref', text: labelOf(item) }),
      textOf(item) && el('p', { class: 'item__desc', text: textOf(item) })));
};

export const evidenceList = (items) =>
  el('ul', { class: 'items' }, ...items.map(entry));
