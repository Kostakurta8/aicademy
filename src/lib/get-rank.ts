/** Pick the first tier whose `min` threshold is met, or fall back to `fallback`. */
export function getRank<T extends string>(
  value: number,
  tiers: ReadonlyArray<{ min: number; label: T }>,
  fallback: T,
): T {
  for (const tier of tiers) {
    if (value >= tier.min) return tier.label
  }
  return fallback
}
