import { interpolateColor } from "#colors/functions/normalization/interpolate-color.ts";

/**
 * Возвращает градиентный цвет для положительного диапазона [0, 1].
 * @param {number} value - Значение от 0 до 1.
 * @param {string} startColor - Цвет для значения 0.
 * @param {string} endColor - Цвет для значения 1.
 * @returns {string} Строка с цветом.
 */
export function getGradientColorForPositiveRange(
  value: number,
  startColor: string,
  endColor: string
): string {
  const clamped = Math.max(0, Math.min(1, value));
  return interpolateColor(startColor, endColor, clamped);
}
