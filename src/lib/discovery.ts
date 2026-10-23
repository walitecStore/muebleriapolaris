export const HISTORY_KEY = 'polaris_search_history';
export function saveSearch(term: string) {
  const clean = term.trim().slice(0, 100);
  if (clean.length < 2) return;
  try {
    const old = readSearches();
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(
        [clean, ...old.filter((x) => x.toLowerCase() !== clean.toLowerCase())].slice(0, 12)
      )
    );
    window.dispatchEvent(new Event('polaris:searches'));
  } catch {
    /* Storage can be unavailable in private browsing. */
  }
}
export function readSearches(): string[] {
  try {
    const d = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(d) ? d.filter((s): s is string => typeof s === 'string').slice(0, 12) : [];
  } catch {
    return [];
  }
}
export function eligibleDiscount(subtotal: number) {
  return Math.floor(Math.round(Math.max(0, subtotal) * 100) / 15000) * 10;
}
