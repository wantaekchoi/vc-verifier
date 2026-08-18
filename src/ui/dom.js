export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export const clear = (node) => { node.replaceChildren(); return node; };

export function safeUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : null;
  } catch {
    return null;
  }
}

export const externalLink = (href, props, ...children) =>
  el('a', { ...props, href, target: '_blank', rel: 'noreferrer noopener' }, ...children);

const SVG = 'http://www.w3.org/2000/svg';

const svgNode = (name, attrs) => {
  const node = document.createElementNS(SVG, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
};

const GLYPH = {
  pass: 'M5.4 8.3l2 2.1 3.4-4.2',
  fail: 'M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8',
  note: 'M5.4 10.6l5.2-5.2',
};

export function stateIcon(state, className) {
  const svg = svgNode('svg', {
    viewBox: '0 0 16 16',
    width: '16',
    height: '16',
    class: className,
    'aria-hidden': 'true',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '1.6',
    'stroke-linecap': 'round',
  });
  svg.append(
    svgNode('circle', { cx: '8', cy: '8', r: '6.6' }),
    svgNode('path', { d: GLYPH[state] ?? GLYPH.note }),
  );
  return svg;
}

export function infoMark() {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('width', '12');
  svg.setAttribute('height', '12');
  svg.setAttribute('class', 'info');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.4');

  const ring = document.createElementNS(SVG, 'circle');
  ring.setAttribute('cx', '8'); ring.setAttribute('cy', '8'); ring.setAttribute('r', '6.5');

  const stem = document.createElementNS(SVG, 'path');
  stem.setAttribute('d', 'M8 7.4v4.2');
  stem.setAttribute('stroke-linecap', 'round');

  const dot = document.createElementNS(SVG, 'circle');
  dot.setAttribute('cx', '8'); dot.setAttribute('cy', '4.6'); dot.setAttribute('r', '0.9');
  dot.setAttribute('fill', 'currentColor'); dot.setAttribute('stroke', 'none');

  svg.append(ring, stem, dot);
  return svg;
}

export function repoMark() {
  const svg = svgNode('svg', {
    viewBox: '0 0 16 16', width: '16', height: '16',
    'aria-hidden': 'true', fill: 'currentColor',
  });
  svg.append(svgNode('path', {
    d: 'M8 .5a7.5 7.5 0 0 0-2.37 14.62c.37.07.5-.16.5-.36v-1.3c-2.09.45-2.53-1-2.53-1-.34-.87-.83-1.1-.83-1.1-.68-.47.05-.46.05-.46.75.05 1.15.77 1.15.77.67 1.15 1.76.82 2.19.63.07-.49.26-.82.48-1.01-1.67-.19-3.42-.84-3.42-3.72 0-.82.29-1.5.77-2.02-.08-.19-.34-.96.07-2 0 0 .63-.2 2.06.77a7.1 7.1 0 0 1 3.75 0c1.43-.97 2.06-.77 2.06-.77.41 1.04.15 1.81.07 2 .48.52.77 1.2.77 2.02 0 2.89-1.76 3.53-3.43 3.71.27.24.51.69.51 1.39v2.06c0 .2.13.44.51.36A7.5 7.5 0 0 0 8 .5Z',
  }));
  return svg;
}

export const shortened = (value, head = 28, tail = 12) => {
  const text = String(value);
  return text.length <= head + tail + 1 ? text
    : `${text.slice(0, head)}…${text.slice(-tail)}`;
};
