import { TF } from "#models/timeframes.ts";
import { getIntervalDurationMs } from "#shared/utils/get-interval-duration-ms.ts";

export function calculateExpirationTime(openTime: number, timeframe: TF) {
  if (typeof openTime !== "number" && typeof openTime !== "string") {
    return undefined;
  }

  const intervalMs = getIntervalDurationMs(timeframe);
  if (typeof intervalMs !== "number" || isNaN(intervalMs) || intervalMs <= 0) {
    return undefined;
  }

  const parsedOpenTime = Number(openTime);
  if (isNaN(parsedOpenTime)) {
    return undefined;
  }

  return parsedOpenTime + 2 * intervalMs + 1;
}
