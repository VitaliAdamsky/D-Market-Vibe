import { KlineData, KlineDataItem } from "#kline/models/kline.ts";
import { PriceActionData, PriceAction } from "#kline/models/price-action.ts";
import { TF } from "#models/timeframes.ts";

/**
 * Простейшие примеры условий.
 * Ты можешь потом их уточнить по своей методике!
 */
function isPinbar(item: KlineDataItem): boolean {
  const body = Math.abs(item.closePrice - item.openPrice);
  const candleRange = item.highPrice - item.lowPrice;
  return body / candleRange < 0.3; // тело меньше 30% от свечи
}

function isHammer(item: KlineDataItem): boolean {
  const body = Math.abs(item.closePrice - item.openPrice);
  const lowerShadow =
    item.openPrice < item.closePrice
      ? item.openPrice - item.lowPrice
      : item.closePrice - item.lowPrice;
  const candleRange = item.highPrice - item.lowPrice;
  return lowerShadow > body * 2 && lowerShadow / candleRange > 0.5;
}

function isDoji(item: KlineDataItem): boolean {
  const body = Math.abs(item.closePrice - item.openPrice);
  const candleRange = item.highPrice - item.lowPrice;
  return body / candleRange < 0.1;
}

function isBullishEngulfing(prev: KlineDataItem, curr: KlineDataItem): boolean {
  return (
    prev.closePrice < prev.openPrice &&
    curr.closePrice > curr.openPrice &&
    curr.openPrice < prev.closePrice &&
    curr.closePrice > prev.openPrice
  );
}

function isBearishEngulfing(prev: KlineDataItem, curr: KlineDataItem): boolean {
  return (
    prev.closePrice > prev.openPrice &&
    curr.closePrice < curr.openPrice &&
    curr.openPrice > prev.closePrice &&
    curr.closePrice < prev.openPrice
  );
}

/**
 * Основная функция агрегации.
 */
export function calculatePriceAction(
  klineDataArray: KlineData[],
  timeframe: TF,
  projectName: string,
  expirationTime: number
): PriceActionData {
  const statsMap: Map<number, PriceAction> = new Map();

  for (const klineData of klineDataArray) {
    const symbol = klineData.symbol;
    const candles = klineData.data.slice(-10); // последние 10 свечей

    for (let i = 0; i < candles.length; i++) {
      const item = candles[i];
      const openTime = item.openTime;

      if (!statsMap.has(openTime)) {
        statsMap.set(openTime, {
          openTime,
          closeTime: item.closeTime,
          pinbars: [],
          hammbers: [],
          dojis: [],
          bearsihEngulfings: [],
          bullishEngulfings: [],
        });
      }

      const stat = statsMap.get(openTime)!;

      if (isPinbar(item)) stat.pinbars.push(symbol);
      if (isHammer(item)) stat.hammbers.push(symbol);
      if (isDoji(item)) stat.dojis.push(symbol);

      // Engulfing — проверяем только если есть предыдущая
      if (i > 0) {
        const prevItem = candles[i - 1];
        if (isBullishEngulfing(prevItem, item))
          stat.bullishEngulfings.push(symbol);
        if (isBearishEngulfing(prevItem, item))
          stat.bearsihEngulfings.push(symbol);
      }
    }
  }

  const data: PriceAction[] = Array.from(statsMap.values()).sort(
    (a, b) => a.openTime - b.openTime
  );

  return {
    projectName,
    timeframe,
    expirationTime,
    data,
  };
}
