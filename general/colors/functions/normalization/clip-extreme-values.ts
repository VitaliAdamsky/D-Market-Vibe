/**
 * Ограничивает экстремальные значения в массиве чисел диапазоном,
 * основанным на стандартном отклонении (±5 стандартных отклонений от среднего).
 * @param {number[]} values - Массив числовых значений для анализа.
 * @returns {[number, number]} Кортеж, содержащий ограниченные минимальное и максимальное значения.
 */
export function clipExtremeValues(values: number[]): [number, number] {
  // Возвращаем [0, 0] если массив пуст или не предоставлен, чтобы избежать ошибок.
  if (!values || values.length === 0) {
    return [0, 0];
  }

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance =
    values
      .map((val) => Math.pow(val - mean, 2))
      .reduce((sum, val) => sum + val, 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // Определяем границы как ±5 стандартных отклонений от среднего.
  const lowerBound = mean - 5 * stdDev;
  const upperBound = mean + 5 * stdDev;

  // Находим фактические минимум и максимум в данных.
  const actualMin = Math.min(...values);
  const actualMax = Math.max(...values);

  // Ограничиваем фактические значения вычисленными границами.
  // Если фактический минимум больше нижней границы, используем его.
  // Если фактический максимум меньше верхней границы, используем его.
  const clippedMin = Math.max(lowerBound, actualMin);
  const clippedMax = Math.min(upperBound, actualMax);

  return [clippedMin, clippedMax];
}
