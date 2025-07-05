/**
 * Агрегирует статистику по всем монетам KlineData[] в общую сводку по каждому времени свечи
 */
import { KlineStatsData, KlineStatsItem } from "#kline/models/market-stats.ts";
import { KlineData } from "#kline/models/kline.ts";
import { TF } from "#models/timeframes.ts";

/**
 * Агрегирует статистику по всем монетам KlineData[] в общую сводку по каждому времени свечи.
 */
export function calculateKlineStats(
  klineDataArray: KlineData[],
  timeframe: TF,
  projectName: string,
  expirationTime: number
): KlineStatsData {
  const statsMap: Map<number, KlineStatsItem> = new Map();

  for (const klineData of klineDataArray) {
    for (const item of klineData.data) {
      const {
        openTime,
        closeTime,
        openPrice,
        closePrice,
        rollingVwap,
        rollingVwapUBand,
        rollingVwapLBand,
      } = item;

      if (
        openPrice == null ||
        closePrice == null ||
        rollingVwap == null ||
        rollingVwapUBand == null ||
        rollingVwapLBand == null
      )
        continue;

      const isBullish = closePrice > openPrice ? 1 : 0;

      const isAboveUBand =
        openPrice > rollingVwapUBand && closePrice > rollingVwapUBand ? 1 : 0;
      const isBelowLBand =
        openPrice < rollingVwapLBand && closePrice < rollingVwapLBand ? 1 : 0;
      const isInsideBands =
        openPrice > rollingVwapLBand &&
        openPrice < rollingVwapUBand &&
        closePrice > rollingVwapLBand &&
        closePrice < rollingVwapUBand
          ? 1
          : 0;

      const isCrossUBandUp =
        openPrice < rollingVwapUBand && closePrice > rollingVwapUBand ? 1 : 0;
      const isCrossLBandUp =
        openPrice < rollingVwapLBand && closePrice > rollingVwapLBand ? 1 : 0;

      const isCrossUBandDown =
        openPrice > rollingVwapUBand && closePrice < rollingVwapUBand ? 1 : 0;
      const isCrossLBandDown =
        openPrice > rollingVwapLBand && closePrice < rollingVwapLBand ? 1 : 0;

      const isCrossVwapUp =
        openPrice < rollingVwap && closePrice > rollingVwap ? 1 : 0;
      const isCrossVwapDown =
        openPrice > rollingVwap && closePrice < rollingVwap ? 1 : 0;

      if (!statsMap.has(openTime)) {
        statsMap.set(openTime, {
          openTime,
          closeTime,
          bullshCandles: 0,
          aboveUBand: 0,
          belowLBand: 0,
          insideBands: 0,
          crossUBandUp: 0,
          crossLBandUp: 0,
          crossUBandDown: 0,
          crossLBandDown: 0,
          crossVwapUp: 0,
          crossVwapDown: 0,
        });
      }

      const stats = statsMap.get(openTime)!;

      stats.bullshCandles += isBullish;
      stats.aboveUBand! += isAboveUBand;
      stats.belowLBand! += isBelowLBand;
      stats.insideBands! += isInsideBands;
      stats.crossUBandUp! += isCrossUBandUp;
      stats.crossLBandUp! += isCrossLBandUp;
      stats.crossUBandDown! += isCrossUBandDown;
      stats.crossLBandDown! += isCrossLBandDown;
      stats.crossVwapUp! += isCrossVwapUp;
      stats.crossVwapDown! += isCrossVwapDown;
    }
  }

  const statsData: KlineStatsItem[] = Array.from(statsMap.values()).sort(
    (a, b) => a.openTime - b.openTime
  );

  return {
    totalCoins: klineDataArray.length,
    projectName,
    timeframe,
    expirationTime,
    data: statsData.slice(-50),
  };
}
