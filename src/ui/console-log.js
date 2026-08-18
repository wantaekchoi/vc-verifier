const STATE_LABEL = { pass: 'match', fail: 'mismatch', note: 'unchecked' };

export function logResult(result) {
  const { outcome, suite, rows, fetches, failure, ms, credential } = result;
  console.groupCollapsed(`%cbindings%c ${outcome} · ${ms}ms`,
    'font-weight:700', 'font-weight:400;color:#666');

  console.info('credential', credential.id ?? '(no id)');
  console.info('cryptosuite', suite?.label ?? `${result.declared} (not implemented)`);

  console.table(rows.map(({ label, left, right, state }) => ({
    row: label, left, right, verdict: STATE_LABEL[state],
  })));

  if (failure) {
    console.warn('reason', failure.text);
    console.warn('library message', failure.raw);
  }

  console.table(fetches.map(({ kind, url, ms: took, ok }) => ({
    kind, url, ms: took, ok,
  })));

  console.info('%cThe credential was never sent anywhere. The list above is everywhere this browser went.',
    'color:#666');
  console.groupEnd();
}
