// deno-lint-ignore-file no-explicit-any
import { Coin } from "#models/coin.ts";
import { TF } from "#models/timeframes.ts";

import { UnixToNamedTimeRu } from "#shared/utils/time-converter.ts";

export async function handleFetchWithFailureTracking(
  fetchFn: any,
  coins: Coin[],
  timeframe: TF,
  limit: number,
  setFailedSymbolsFn: any,
  coinType: string,
  exchange: string
) {
  const results = await fetchFn(coins, timeframe, limit);

  const failedSymbols = [];
  const succeeded = [];

  for (const result of results) {
    if (!result.data || result.data.length === 0) {
      const errorDetails = {
        symbol: result.symbol,
        time: UnixToNamedTimeRu(Date.now()),
        error: result.error || "No data returned",
      };
      failedSymbols.push(errorDetails);
    } else {
      succeeded.push(result);
    }
  }

  // Cache failed symbols
  if (setFailedSymbolsFn && failedSymbols.length > 0) {
    setFailedSymbolsFn(exchange, coinType, failedSymbols);
  }

  return succeeded.map((result) => result.data);
}
