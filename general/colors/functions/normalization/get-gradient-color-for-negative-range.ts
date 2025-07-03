/**
 * Возвращает цвет в зависимости от знака значения.
 * @param {number} value - Значение для проверки.
 * @param {string} minColor - Цвет для отрицательных значений.
 * @param {string} maxColor - Цвет для положительных значений.
 * @returns {string} Строка с цветом.
 */
export function getGradientColorForNegativeRange(
  value: number,
  minColor: string,
  maxColor: string
): string {
  return value === 0 ? "#f5f5f0" : value > 0 ? maxColor : minColor;
}
