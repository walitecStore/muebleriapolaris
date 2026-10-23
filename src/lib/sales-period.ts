export type SalesPeriod = 'day' | 'week' | 'month' | 'year';
export function limaDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
/** Calendar boundaries in Peru (UTC-5); weeks start Monday. End is exclusive. */
export function salesRange(period: SalesPeriod, date: string) {
  if (!['day', 'week', 'month', 'year'].includes(period) || !/^\d{4}-\d{2}-\d{2}$/.test(date))
    throw new Error('Período o fecha no válidos.');
  const start = new Date(`${date}T00:00:00.000Z`);
  if (
    !Number.isFinite(start.getTime()) ||
    start.toISOString().slice(0, 10) !== date ||
    start.getUTCFullYear() < 2000 ||
    start.getUTCFullYear() > 2100
  )
    throw new Error('Fecha no válida.');
  if (period === 'week') start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  if (period === 'month') start.setUTCDate(1);
  if (period === 'year') start.setUTCMonth(0, 1);
  const end = new Date(start);
  if (period === 'day') end.setUTCDate(end.getUTCDate() + 1);
  if (period === 'week') end.setUTCDate(end.getUTCDate() + 7);
  if (period === 'month') end.setUTCMonth(end.getUTCMonth() + 1);
  if (period === 'year') end.setUTCFullYear(end.getUTCFullYear() + 1);
  return {
    start: new Date(start.getTime() + 5 * 3600_000).toISOString(),
    end: new Date(end.getTime() + 5 * 3600_000).toISOString(),
  };
}
export function csvCell(value: unknown) {
  let cell = String(value ?? '');
  if (/^[\s]*[=+\-@\t\r]/.test(cell)) cell = "'" + cell;
  return '"' + cell.replace(/"/g, '""') + '"';
}
