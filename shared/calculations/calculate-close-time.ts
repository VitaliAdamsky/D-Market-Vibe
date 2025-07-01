export function calculateCloseTime(openTime: number, intervalMs: number) {
  return Number(openTime) + Number(intervalMs) - 1;
}
