/**
 * Преобразует числовое значение в цвет (от красного до зеленого) на основе диапазона.
 * @param {number} value - Текущее значение.
 * @param {number} min - Минимальное значение в диапазоне.
 * @param {number} max - Максимальное значение в диапазоне.
 * @returns {string} Строка цвета в формате "rgb(r, g, b)".
 */
export function getColorFromChangeValue(
  value: number,
  min: number,
  max: number
): string {
  const MAX_SCALE = 500;
  const MAX_CHANNEL_INTENSITY = 180; // Ограничение для самого темного красного/зеленого

  const absMax = Math.max(Math.abs(min), Math.abs(max));
  const scale = Math.min(absMax, MAX_SCALE);

  // Обработка случая, когда масштаб равен нулю, чтобы избежать деления на ноль.
  if (scale === 0) {
    return "rgb(255, 255, 255)";
  }

  const clampedValue = Math.max(-scale, Math.min(value, scale));

  const ZERO_THRESHOLD = 0.01;
  if (Math.abs(clampedValue) < ZERO_THRESHOLD) {
    return "rgb(255, 255, 255)";
  }

  const normalized = Math.pow(Math.abs(clampedValue) / scale, 0.5);
  const intensity = Math.round(normalized * MAX_CHANNEL_INTENSITY);

  let r = 255,
    g = 255,
    b = 255;

  if (clampedValue < 0) {
    // Красный: темно-красный = полный красный минус ограниченная интенсивность для зеленого/синего
    g = 255 - intensity;
    b = 255 - intensity;
  } else {
    // Зеленый: темно-зеленый = полный зеленый минус ограниченная интенсивность для красного/синего
    r = 255 - intensity;
    b = 255 - intensity;
  }

  return `rgb(${r}, ${g}, ${b})`;
}
