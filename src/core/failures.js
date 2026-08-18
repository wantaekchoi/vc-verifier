const KNOWN = [
  {
    test: /invalid signature/i,
    settles: true,
    text: '서명이 이 문서와 맞지 않는다. 서명한 뒤 내용이 바뀌었거나 다른 문서에 붙어 있던 서명이다.',
  },
  {
    test: /not authorized by controller/i,
    settles: true,
    text: '서명에 쓴 키가 주장 서명용으로 등재돼 있지 않다. 신원 문서가 승인하지 않은 용도다.',
  },
  {
    test: /publicKeyMultibase.*required|no public key|key.*not found/i,
    settles: false,
    text: '검증방법이 키 하나를 지정하지 않아 어떤 키로 맞춰볼지 정하지 못했다. ' +
      '신원까지만 가리키는 크리덴셜도 허용하는 검증기에서는 통과한다.',
  },
  {
    test: /verification method.*(not found|could not be)|dereference/i,
    settles: false,
    text: '신원 문서에서 그 키를 찾지 못했다.',
  },
  {
    test: /safe mode|context.*(not allowed|url)|dropping property|term.*not defined/i,
    settles: false,
    text: '이 크리덴셜이 쓰는 용어 정의는 다루지 않는다. 정의를 확인하지 못하면 서명이 무엇을 덮는지도 알 수 없다.',
  },
  {
    test: /failed to fetch|network|load.*document/i,
    settles: false,
    text: '검증에 필요한 문서를 받아오지 못했다.',
  },
];

export function explainFailure(message = '') {
  const known = KNOWN.find((entry) => entry.test.test(message));
  return known
    ? { text: known.text, settles: known.settles, raw: message }
    : { text: '검증이 끝나지 않았다.', settles: false, raw: message };
}
