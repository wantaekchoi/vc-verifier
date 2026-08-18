const BAKED_IN_SVG = /<openbadges:credential[^>]*>([\s\S]*?)<\/openbadges:credential>/;
const CDATA = /<!\[CDATA\[([\s\S]*?)\]\]>/;

const UNREACHABLE =
  'Could not fetch it. The other server blocked the browser request, or did not answer, or the address is wrong. '
  + 'The browser does not tell these apart. Paste it below or open the file instead.';

export function fromText(text) {
  const body = text.trim();
  if (!body) throw new Error('The input is empty.');
  if (body.startsWith('{')) return JSON.parse(body);

  const baked = BAKED_IN_SVG.exec(body);
  if (baked) {
    const inner = baked[1];
    return JSON.parse((CDATA.exec(inner)?.[1] ?? inner).trim());
  }
  throw new Error('No credential found. It must be JSON, or a badge image with a credential baked in.');
}

export async function fromUrl(url) {
  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error(UNREACHABLE);
  }
  if (!response.ok) throw new Error(`The server answered ${response.status}.`);
  return fromText(await response.text());
}

export async function fromFile(file) {
  if (/^image\/(png|jpeg|gif|webp)$/.test(file.type)) {
    throw new Error(
      `Credentials inside ${file.type} are not read yet. SVG badges and JSON files are.`);
  }
  return fromText(await file.text());
}
