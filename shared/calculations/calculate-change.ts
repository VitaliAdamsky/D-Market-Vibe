// Функция для вычисления изменений в процентах
export function calcChange(
  current: number,
  previous: number
): number | undefined {
  if (typeof previous !== "number" || previous === 0) return undefined;
  if (typeof current !== "number") return undefined;
  return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(2));
}
