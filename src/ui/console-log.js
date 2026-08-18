const STATE_LABEL = { pass: '일치', fail: '어긋남', note: '보류' };

export function logResult(result) {
  const { outcome, suite, rows, fetches, failure, ms, credential } = result;
  console.groupCollapsed(`%c키 대조%c ${outcome} · ${ms}ms`,
    'font-weight:700', 'font-weight:400;color:#666');

  console.info('크리덴셜', credential.id ?? '(id 없음)');
  console.info('서명 방식', suite?.label ?? `${result.declared} (다루지 않음)`);

  console.table(rows.map(({ label, left, right, state }) => ({
    항목: label, 왼쪽: left, 오른쪽: right, 판정: STATE_LABEL[state],
  })));

  if (failure) {
    console.warn('설명', failure.text);
    console.warn('검증 라이브러리 원문', failure.raw);
  }

  console.table(fetches.map(({ kind, url, ms: took, ok }) => ({
    종류: kind, 주소: url, 소요: `${took}ms`, 받음: ok,
  })));

  console.info('%c크리덴셜을 어디로도 보내지 않았다. 위 목록이 이 브라우저가 나간 곳 전부다.',
    'color:#666');
  console.groupEnd();
}
