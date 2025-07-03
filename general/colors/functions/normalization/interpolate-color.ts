import { hexToRgb } from "#colors/functions/normalization/hex-to-rgb.ts";

export function interpolateColor(
  color1: string,
  color2: string,
  factor: number
) {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const result = c1
    .map((c, i) => Math.round(c + factor * (c2[i] - c)))
    .map((v) => v.toString(16).padStart(2, "0"));
  return `#${result.join("")}`;
}
