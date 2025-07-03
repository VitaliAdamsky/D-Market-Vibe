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
import { mergeSpotWithPerps } from "#kline/functions/processing/merge-spot-with-perps.ts";
import { normalizeKlineData } from "#kline/functions/processing/normalize-kline-data.ts";
import { MarketData } from "#models/market-data.ts";
import { KlineData, KlineDataItem } from "#kline/models/kline.ts";
import { SpotKlineData } from "#kline/models/spot.ts";
import { calculateRollingVwap } from "#shared/calculations/calculate-rolling-vwap.ts";
import { calculateKlineStats } from "#shared/calculations/calculate-kline-stats.ts";
import { KlineStatsData } from "#kline/models/market-stats.ts";
import { VwapStatsData } from "#kline/models/vwap-stats.ts";
import { calculateVwapStats } from "#shared/calculations/calculate-vwap-stats.ts";

/**
 * Загружает Kline данные по таймфрейму и возвращает MarketData и KlineStatsData.
 */
export async function fetchKlineData(
  timeframe: TF,
  limit: number
): Promise<{
  marketData: MarketData;
  klineStatsData: KlineStatsData;
  vwapStatsData: VwapStatsData;
}> {
  // 1. Загружаем список монет
  const { binancePerps, bybitPerps, binanceSpot, bybitSpot } =
    await CoinsRepo.getCoinsFromCache();

  // 2. Фетчим с трекингом ошибок
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

  // 3. Явные типы
  const binanceKlinePerpData = binanceKlinePerpDataRaw as KlineData[];
  const bybitKlinePerpData = bybitKlinePerpDataRaw as KlineData[];
  const binanceKlineSpotData = binanceKlineSpotDataRaw as SpotKlineData[];
  const bybitKlineSpotData = bybitKlineSpotDataRaw as SpotKlineData[];

  // 4. Определяем время последней свечи для расчета expiration
  const lastItem: KlineDataItem | undefined =
    binanceKlinePerpData[0]?.data?.at(-1) ??
    bybitKlinePerpData[0]?.data?.at(-1);

  const lastOpenTime = lastItem?.openTime ?? Date.now();
  const expirationTimeRaw = calculateExpirationTime(lastOpenTime, timeframe);

  const expirationTime = expirationTimeRaw ?? Date.now();

  const projectName = ServantsConfigOperator.getConfig().projectName;

  // 5. Мержим спот и перпы
  let data = mergeSpotWithPerps(
    [...binanceKlinePerpData, ...bybitKlinePerpData],
    [...binanceKlineSpotData, ...bybitKlineSpotData]
  );

  // 6. Нормализуем и считаем Rolling VWAP
  data = normalizeKlineData(data);
  data = calculateRollingVwap(data, timeframe);

  // 7. Отфильтровываем пустые
  data = data.filter((coinData) => coinData.data.length > 0);
  const emptyCoins = data
    .filter((coinData) => coinData.data.length === 0)
    .map((coinData) => coinData.symbol);
  console.log("[fetchKlineData] Empty coins:", emptyCoins);

  // 8. Считаем KlineStats
  const klineStatsData = calculateKlineStats(
    data,
    timeframe,
    projectName,
    expirationTime
  );

  const vwapStatsData = calculateVwapStats(
    data,
    timeframe,
    projectName,
    expirationTime
  );

  // 9. Формируем MarketData
  const marketData: MarketData = {
    projectName,
    dataType: "kline",
    timeframe,
    expirationTime,
    data,
  };

  return { marketData, klineStatsData, vwapStatsData };
}
