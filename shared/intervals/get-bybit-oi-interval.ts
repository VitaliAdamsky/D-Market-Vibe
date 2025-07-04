import { TF } from "#models/timeframes.ts";

export function getBybitOiInterval(timeframe: TF) {
  const timeframes = {
    "1m": "1",
    "5m": "5",
    "15m": "15",
    "30m": "30",
    "1h": "60",
    "2h": "120",
    "4h": "240",
    "6h": "360",
    "8h": "480",
    "12h": "720",
    D: "D",
  };

  if (!(timeframe in timeframes)) {
    throw new Error(`Unsupported timeframe: ${timeframe}`);
  }

  return timeframes[timeframe];
}
