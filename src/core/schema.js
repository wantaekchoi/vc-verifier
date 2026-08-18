const HANDLED = new Set(['1EdTechJsonSchemaValidator2019', 'JsonSchema']);

const declaredSchemas = (credential) => {
  const declared = credential.credentialSchema;
  if (!declared) return [];
  return Array.isArray(declared) ? declared : [declared];
};

let validatorPromise = null;
const compiled = new Map();

async function validator() {
  if (!validatorPromise) {
    validatorPromise = (async () => {
      const [{ default: Ajv }, { default: addFormats }] = await Promise.all([
        import('ajv/dist/2019.js'),
        import('ajv-formats'),
      ]);
      const ajv = new Ajv({ strict: false, allErrors: true, validateFormats: true });
      addFormats(ajv);
      return ajv;
    })();
  }
  return validatorPromise;
}

const firstErrors = (errors, limit = 4) =>
  (errors ?? []).slice(0, limit).map((e) => `${e.instancePath || '/'} ${e.message}`);

async function checkOne(credential, entry, record) {
  const id = typeof entry === 'string' ? entry : entry?.id;
  const type = typeof entry === 'string' ? null : entry?.type;

  if (!id) return { id, type, state: 'note', detail: 'The entry names no schema.' };
  if (type && !HANDLED.has(type)) {
    return { id, type, state: 'note', detail: `${type} is not a validator this page implements.` };
  }

  const started = performance.now();
  let schema;
  try {
    const response = await fetch(id);
    record({ url: id, kind: 'schema', ms: Math.round(performance.now() - started), ok: response.ok });
    if (!response.ok) {
      return { id, type, state: 'note', detail: `The schema could not be fetched (HTTP ${response.status}).` };
    }
    schema = await response.json();
  } catch (e) {
    record({ url: id, kind: 'schema', ms: Math.round(performance.now() - started), ok: false, error: e.message });
    return { id, type, state: 'note', detail: 'The schema could not be fetched.' };
  }

  try {
    const ajv = await validator();
    let validate = compiled.get(id);
    if (!validate) {
      validate = ajv.compile(schema);
      compiled.set(id, validate);
    }
    return validate(credential)
      ? { id, type, state: 'pass', detail: 'The credential matches the shape its schema requires.' }
      : { id, type, state: 'fail', detail: firstErrors(validate.errors).join(' · ') };
  } catch (e) {
    return { id, type, state: 'note', detail: `The schema could not be applied: ${e.message}` };
  }
}

export async function checkSchemas(credential, record) {
  const declared = declaredSchemas(credential);
  if (!declared.length) return null;
  return Promise.all(declared.map((entry) => checkOne(credential, entry, record)));
}
