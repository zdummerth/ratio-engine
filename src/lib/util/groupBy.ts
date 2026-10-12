/** Groups items by key, preserving the order in which keys are first seen. */
export function groupBy<T, K>(items: readonly T[], keyOf: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const group = groups.get(key);
    if (group) {
      group.push(item);
    } else {
      groups.set(key, [item]);
    }
  }
  return groups;
}

/** Locale-independent ascending comparison for codes such as `N101`. */
export function compareCodes(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
