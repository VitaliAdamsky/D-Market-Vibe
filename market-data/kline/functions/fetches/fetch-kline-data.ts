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
import { PriceActionStatsData } from "#kline/models/price-action-stats.ts";
import { calculatePriceActionStats } from "../../../../shared/calculations/calculate-price-action-stats.ts";
import { PriceActionData } from "#kline/models/price-action.ts";
import { calculatePriceAction } from "#shared/calculations/calculate-price-action.ts";
import { HmaActionData } from "#kline/models/hma-action.ts";
import { HmaStatsData } from "#kline/models/hma-stats.ts";
import { calculateHmaStatsData } from "#shared/calculations/calculate-hma-stats.ts";
import { calculateHmaAction } from "#shared/calculations/calculate-hma-action.ts";
import { VwapActionData } from "#kline/models/vwap-action.ts";
import { calculateVwapActionData } from "#shared/calculations/calculate-vwap-action.ts";

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
  vwapActionData: VwapActionData;
  priceActionStatsData?: PriceActionStatsData;
  priceActionData?: PriceActionData;
  hmaStatsData?: HmaStatsData;
  hmaActionData?: HmaActionData;
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

  const binanceKlinePerpData = binanceKlinePerpDataRaw as KlineData[];
  const bybitKlinePerpData = bybitKlinePerpDataRaw as KlineData[];
  const binanceKlineSpotData = binanceKlineSpotDataRaw as SpotKlineData[];
  const bybitKlineSpotData = bybitKlineSpotDataRaw as SpotKlineData[];

  const lastItem: KlineDataItem | undefined =
    binanceKlinePerpData[0]?.data?.at(-1) ??
    bybitKlinePerpData[0]?.data?.at(-1);

  const lastOpenTime = lastItem?.openTime ?? Date.now();
  const expirationTimeRaw = calculateExpirationTime(lastOpenTime, timeframe);
  const expirationTime = expirationTimeRaw ?? Date.now();
  const projectName = ServantsConfigOperator.getConfig().projectName;

  let data = mergeSpotWithPerps(
    [...binanceKlinePerpData, ...bybitKlinePerpData],
    [...binanceKlineSpotData, ...bybitKlineSpotData]
  );

  data = normalizeKlineData(data);
  data = calculateRollingVwap(data, timeframe);

  data = data.filter((coinData) => coinData.data.length > 0);

  const klineStatsData = calculateKlineStats(
    data,
    timeframe,
    projectName,
    expirationTime
  );

  const hmaStatsData = calculateHmaStatsData(
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

  const vwapActionData = calculateVwapActionData(
    data,
    timeframe,
    projectName,
    expirationTime
  );

  let priceActionStatsData: PriceActionStatsData | undefined = undefined;

  let priceActionData: PriceActionData | undefined = undefined;
  let hmaActionData: HmaActionData | undefined = undefined;

  if (timeframe === TF.h4 || timeframe === TF.h12 || timeframe === TF.D) {
    priceActionStatsData = calculatePriceActionStats(
      data,
      timeframe,
      projectName,
      expirationTime
    );

    priceActionData = calculatePriceAction(
      data,
      timeframe,
      projectName,
      expirationTime
    );

    hmaActionData = calculateHmaAction(
      data,
      timeframe,
      projectName,
      expirationTime
    );
  }

  const marketData: MarketData = {
    projectName,
    dataType: "kline",
    timeframe,
    expirationTime,
    data: data.map((coin) => ({
      ...coin, // копируем всё как есть
      data: coin.data.slice(-50), // урезаем массив последних свечей
    })),
  };

  return {
    marketData,
    klineStatsData,
    vwapStatsData,
    priceActionStatsData,
    priceActionData,
    hmaStatsData,
    hmaActionData,
    vwapActionData,
  };
}
