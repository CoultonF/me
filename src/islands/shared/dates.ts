/** Format a Date as YYYY-MM-DD in the user's local timezone */
export function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Convert a UTC ISO timestamp (e.g. from DB) to a local YYYY-MM-DD string */
export function utcToLocalDate(iso: string): string {
  return localDateStr(new Date(iso));
}
