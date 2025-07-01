// deno-lint-ignore-file no-explicit-any
export function getPercentile(array: any[], percentile: number) {
  if (array.length === 0) return 0;

  const sorted = [...array].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const floor = Math.floor(index);
  const ceil = Math.ceil(index);
  const weight = index - floor;

  if (floor === ceil) return sorted[floor];
  return sorted[floor] * (1 - weight) + sorted[ceil] * weight;
}
