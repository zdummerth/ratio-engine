/** Display helpers. Values arrive already rounded; these only fix the digits shown. */

export function formatRatio(value: number | null): string {
  return value === null ? '—' : value.toFixed(4);
}

export function formatCod(value: number | null): string {
  return value === null ? '—' : value.toFixed(2);
}

export function formatCount(value: number): string {
  return value.toLocaleString('en-US');
}
