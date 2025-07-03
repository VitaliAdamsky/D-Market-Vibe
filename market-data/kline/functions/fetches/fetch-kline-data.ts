import { handleFetchWithFailureTracking } from "#shared/general/handle-fetch-with-failure-tracking.ts";
import { TF } from "#models/timeframes.ts";
import { fetchBinancePerpKlines } from "#kline/functions/fetches/fetch-binance-perp-klines.ts";
import { fetchBinanceSpotKlines } from "#kline/functions/fetches/fetch-binance-spot-klines.ts";
import { fetchBybitPerpKlines } from "#kline/functions/fetches/fetch-bybit-perp-klines.ts";
import { fetchBybitSpotKlines } from "#kline/functions/fetches/fetch-bybit-spot-klines.ts";
import { CoinsRepo } from "#coins/coins-repo.ts";
import { addFailedCoinsToCache } from "#kline/functions/processing/add-failed-coins-to-cache.ts";
import { calculateExpirationTime } from "#shared/calculations/calculate-expiration-time.ts";
import { ServantsConfigOperator } from "#global/servant-config.ts";
import { mergeSpotWithPerps } from "../processing/merge-spot-with-perps.ts";
import { normalizeKlineData } from "../processing/normalize-kline-data.ts";
import { MarketData } from "#models/market-data.ts";
import { KlineData, KlineDataItem } from "../../models/kline.ts";
import { SpotKlineData } from "../../models/spot.ts";

export async function fetchKlineData(
  timeframe: TF,
  limit: number
): Promise<MarketData> {
  const { binancePerps, bybitPerps, binanceSpot, bybitSpot } =
    await CoinsRepo.getCoinsFromCache();

  const [
    binanceKlinePerpDataRaw,
    bybitKlinePerpDataRaw,
    binanceKlineSpotDataRaw,
    bybitKlineSpotDataRaw,
  ] = await Promise.all([
    handleFetchWithFailureTracking(
      fetchBinancePerpKlines,
      binancePerps || [],
      timeframe,
      limit,
      addFailedCoinsToCache,
      "perp",
      "Binance"
    ),
    handleFetchWithFailureTracking(
      fetchBybitPerpKlines,
      bybitPerps || [],
      timeframe,
      limit,
      addFailedCoinsToCache,
      "perp",
      "Bybit"
    ),
    handleFetchWithFailureTracking(
      fetchBinanceSpotKlines,
      binanceSpot || [],
      timeframe,
      limit,
      addFailedCoinsToCache,
      "spot",
      "Binance"
    ),
    handleFetchWithFailureTracking(
      fetchBybitSpotKlines,
      bybitSpot || [],
      timeframe,
      limit,
      addFailedCoinsToCache,
      "spot",
      "Bybit"
    ),
  ]);

  // Явные касты к нужным типам
  const binanceKlinePerpData = binanceKlinePerpDataRaw as KlineData[];
  const bybitKlinePerpData = bybitKlinePerpDataRaw as KlineData[];
  const binanceKlineSpotData = binanceKlineSpotDataRaw as SpotKlineData[];
  const bybitKlineSpotData = bybitKlineSpotDataRaw as SpotKlineData[];

  //3. Calculate when this data should expire
  const lastItem =
    (binanceKlinePerpData[0]?.data?.at(-1) as KlineDataItem | undefined) ??
    (bybitKlinePerpData[0]?.data?.at(-1) as KlineDataItem | undefined);

  const lastOpenTime: number = lastItem?.openTime ?? 0;

  const expirationTimeRaw = calculateExpirationTime(lastOpenTime, timeframe);
  const expirationTime: number = expirationTimeRaw ?? 0; // <-- здесь фикс
  let data = mergeSpotWithPerps(
    [...binanceKlinePerpData, ...bybitKlinePerpData],
    [...binanceKlineSpotData, ...bybitKlineSpotData]
  );

  //4. Normalize and merge
  data = normalizeKlineData([...data]);
  data = data.filter((coinData) => coinData.data.length > 0);
  const emptyCoins = data
    .filter((coinData) => coinData.data.length === 0)
    .map((coinData) => coinData.symbol);
  console.log("Empty coins:", emptyCoins);

  return {
    projectName: ServantsConfigOperator.getConfig().projectName,
    dataType: "kline",
    timeframe,
    expirationTime,
    data: data,
  };
}
