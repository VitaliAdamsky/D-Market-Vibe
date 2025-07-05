import { KlineData } from "#kline/models/kline.ts";
import { VwapAction, VwapActionData } from "#kline/models/vwap-action.ts";

export function calculateVwapActionData(
  klineDataArray: KlineData[],
  timeframe: string,
  projectName: string,
  expirationTime: number
): VwapActionData {
  // 1️⃣ Собираем все уникальные openTime
  const allTimes = new Set<number>();
  for (const coin of klineDataArray) {
    for (const item of coin.data) {
      allTimes.add(item.openTime);
    }
  }

  // 2️⃣ Сортируем и берём последние 15
  const last15Times = Array.from(allTimes)
    .sort((a, b) => a - b)
    .slice(-15);

  const actionItems: VwapAction[] = [];

  // 3️⃣ Для каждого openTime считаем сигнал по всем монетам
  for (const openTime of last15Times) {
    const closeTime = openTime + getCandleIntervalMs(timeframe);

    const item: VwapAction = {
      openTime,
      closeTime,
      crossUBandUp: [],
      crossLBandUp: [],
      crossUBandDown: [],
      crossLBandDown: [],
      crossVwapUp: [],
      crossVwapDown: [],
      aboveUBand: [],
      belowLBand: [],
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

      if (o < ub && c > ub) item.crossUBandUp.push(sym);
      if (o < lb && c > lb) item.crossLBandUp.push(sym);
      if (o > ub && c < ub) item.crossUBandDown.push(sym);
      if (o > lb && c < lb) item.crossLBandDown.push(sym);

      if (o < vwap && c > vwap) item.crossVwapUp.push(sym);
      if (o > vwap && c < vwap) item.crossVwapDown.push(sym);
    }

    actionItems.push(item);
  }

  return {
    projectName,
    timeframe,
    expirationTime,
    data: actionItems,
  };
}

// Вспомогалка — можешь вынести в utils если нужно
function getCandleIntervalMs(timeframe: string): number {
  switch (timeframe) {
    case "m1":
      return 60_000;
    case "m5":
      return 5 * 60_000;
    case "m15":
      return 15 * 60_000;
    case "h1":
      return 60 * 60_000;
    case "h4":
      return 4 * 60 * 60_000;
    case "h12":
      return 12 * 60 * 60_000;
    case "D":
      return 24 * 60 * 60_000;
    default:
      return 0;
  }
}
