import { KlineData } from "#kline/models/kline.ts";
import { VwapStatsData, VwapStatsItem } from "#kline/models/vwap-stats.ts";

export function calculateVwapStats(
  klineDataArray: KlineData[],
  timeframe: string,
  projectName: string,
  expirationTime: number
): VwapStatsData {
  // Собираем все уникальные openTime
  const allTimes = new Set<number>();
  for (const coin of klineDataArray) {
    for (const item of coin.data) {
      allTimes.add(item.openTime);
    }
  }

  // Сортируем и берём последние 10 openTime
  const last10Times = Array.from(allTimes)
    .sort((a, b) => a - b)
    .slice(-10);

  const statsItems: VwapStatsItem[] = [];

  for (const openTime of last10Times) {
    const item: VwapStatsItem = {
      aboveUBand: [],
      belowLBand: [],
      insideBands: [],
      crossUBandUp: [],
      crossLBandUp: [],
      crossUBandDown: [],
      crossLBandDown: [],
      crossVwapUp: [],
      crossVwapDown: [],
    };

    for (const coin of klineDataArray) {
      const candle = coin.data.find((c) => c.openTime === openTime);
      if (!candle) continue;

      const o = candle.openPrice;
      const c = candle.closePrice;
      const vwap = candle.rollingVwap ?? 0;
      const ub = candle.rollingVwapUBand ?? 0;
      const lb = candle.rollingVwapLBand ?? 0;

      const sym = coin.symbol;

      if (o > ub && c > ub) item.aboveUBand.push(sym);
      if (o < lb && c < lb) item.belowLBand.push(sym);
      if (c > lb && c < ub && o > lb && o < ub) item.insideBands.push(sym);

      if (o < ub && c > ub) item.crossUBandUp.push(sym);
      if (o < lb && c > lb) item.crossLBandUp.push(sym);
      if (o > ub && c < ub) item.crossUBandDown.push(sym);
      if (o > lb && c < lb) item.crossLBandDown.push(sym);

      if (o < vwap && c > vwap) item.crossVwapUp.push(sym);
      if (o > vwap && c < vwap) item.crossVwapDown.push(sym);
    }

    statsItems.push(item);
  }

  return {
    projectName,
    timeframe,
    expirationTime,
    data: statsItems,
  };
}
