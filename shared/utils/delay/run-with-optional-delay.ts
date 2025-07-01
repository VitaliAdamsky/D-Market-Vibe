// deno-lint-ignore-file no-explicit-any
import { TF } from "#models/timeframes.ts";
import { getDelayForTimeframe } from "./get-delay-for-timeframe.ts";

export function runWithOptionalDelay(timeframe: TF, fn: any) {
  const delay = getDelayForTimeframe(timeframe);
  if (delay > 0) {
    setTimeout(fn, delay);
  } else {
    fn();
  }
}
