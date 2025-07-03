// deno-lint-ignore-file no-explicit-any
import { Coin } from "#models/coin.ts";
import { TF } from "#models/timeframes.ts";

import { UnixToNamedTimeRu } from "#shared/utils/time-converter.ts";
import { KlineData } from "#kline/models/kline.ts";
import { SpotKlineData } from "#kline/models/spot.ts";

export async function handleFetchWithFailureTracking(
  fetchFn: any,
  coins: Coin[],
  timeframe: TF,
  limit: number,
  setFailedSymbolsFn: any,
  coinType: string,
  exchange: string
): Promise<KlineData[] | SpotKlineData[]> {
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

  if (setFailedSymbolsFn && failedSymbols.length > 0) {
    setFailedSymbolsFn(exchange, coinType, failedSymbols);
  }

  // Сплющиваем массивы data из каждого результата
  const flattenedData = succeeded.map((result) => result.data).flat();

  return flattenedData;
}
