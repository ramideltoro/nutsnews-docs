export function selectAudience({
  explicit,
  stored,
  fallback,
  allowed = ['simple', 'technical'],
}) {
  if (allowed.includes(explicit)) return explicit;
  if (allowed.includes(stored)) return stored;
  return allowed.includes(fallback) ? fallback : allowed[0];
}

export function readAudiencePreference(storage, key) {
  if (!storage || !key) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function persistAudiencePreference(storage, key, value, allowed = ['simple', 'technical']) {
  if (!storage || !key || !allowed.includes(value)) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function resolvedAudienceUrl({
  currentHref,
  destinationHref,
  queryParameter,
}) {
  const current = new URL(currentHref);
  const target = new URL(destinationHref, current);
  if (queryParameter) current.searchParams.delete(queryParameter);
  target.search = current.searchParams.toString();
  target.hash = current.hash;
  return target.href;
}

export function destinationWithCurrentFragment({
  currentHref,
  destinationHref,
}) {
  const current = new URL(currentHref);
  const target = new URL(destinationHref, current);
  target.hash = current.hash;
  return `${target.pathname}${target.search}${target.hash}`;
}
