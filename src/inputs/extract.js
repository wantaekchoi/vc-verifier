const BAKED_IN_SVG = /<openbadges:credential[^>]*>([\s\S]*?)<\/openbadges:credential>/;
const CDATA = /<!\[CDATA\[([\s\S]*?)\]\]>/;

const UNREACHABLE =
  '받아오지 못했다. 상대 서버가 브라우저에서 오는 요청을 막았거나, 응답이 없거나, 주소가 틀렸다. ' +
  '브라우저는 이 셋을 구별해 알려주지 않는다. 아래에 붙여넣거나 파일을 열면 그대로 검증할 수 있다.';

export function fromText(text) {
  const body = text.trim();
  if (!body) throw new Error('내용이 비어 있다.');
  if (body.startsWith('{')) return JSON.parse(body);

  const baked = BAKED_IN_SVG.exec(body);
  if (baked) {
    const inner = baked[1];
    return JSON.parse((CDATA.exec(inner)?.[1] ?? inner).trim());
  }
  throw new Error('크리덴셜을 찾지 못했다. JSON이거나 크리덴셜이 구워진 배지 이미지여야 한다.');
}

export async function fromUrl(url) {
  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error(UNREACHABLE);
  }
  if (!response.ok) throw new Error(`${response.status} 응답을 받았다.`);
  return fromText(await response.text());
}

export async function fromFile(file) {
  if (/^image\/(png|jpeg|gif|webp)$/.test(file.type)) {
    throw new Error(
      `${file.type} 안의 크리덴셜은 아직 읽지 못한다. SVG 배지나 JSON 파일은 읽는다.`);
  }
  return fromText(await file.text());
}
