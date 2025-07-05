import { KlineData, KlineDataItem } from "#kline/models/kline.ts";
import {
  PriceActionStatsData,
  PriceActionStatsItem,
} from "#kline/models/price-action-stats.ts";

/**
 * Основная функция расчёта Price Action статистики.
 */
export function calculatePriceActionStats(
  klineDataArray: KlineData[],
  timeframe: string,
  projectName: string,
  expirationTime: number
): PriceActionStatsData {
  const statsMap: Map<number, PriceActionStatsItem> = new Map();

  for (const klineData of klineDataArray) {
    let prevCandle: KlineDataItem | null = null;

    for (const candle of klineData.data) {
      const openTime = candle.openTime;
      const closeTime = candle.closeTime;

      const isBullish = candle.closePrice > candle.openPrice ? 1 : 0;
      const pinbar = isPinbar(candle) ? 1 : 0;
      const hammer = isHammer(candle) ? 1 : 0;
      const doji = isDoji(candle) ? 1 : 0;

      let bullishEngulfing = 0;
      let bearishEngulfing = 0;

      if (prevCandle) {
        if (isBullishEngulfing(prevCandle, candle)) bullishEngulfing = 1;
        if (isBearishEngulfing(prevCandle, candle)) bearishEngulfing = 1;
      }

      if (!statsMap.has(openTime)) {
        statsMap.set(openTime, {
          openTime,
          closeTime,
          bullishCandles: 0,
          pinbars: 0,
          hammbers: 0,
          dojis: 0,
          bullishEngulfings: 0,
          bearsihEngulfings: 0,
        });
      }

      const stats = statsMap.get(openTime)!;

      stats.bullishCandles += isBullish;
      stats.pinbars += pinbar;
      stats.hammbers += hammer;
      stats.dojis += doji;
      stats.bullishEngulfings += bullishEngulfing;
      stats.bearsihEngulfings += bearishEngulfing;

      prevCandle = candle;
    }
  }

  const statsData: PriceActionStatsItem[] = Array.from(statsMap.values()).sort(
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

/**
 * Проверка: является ли свеча пинбаром.
 * Классика: длинный хвост и маленькое тело.
 */
function isPinbar(candle: KlineDataItem): boolean {
  const body = Math.abs(candle.closePrice - candle.openPrice);
  const range = candle.highPrice - candle.lowPrice;
  const upperWick =
    candle.highPrice - Math.max(candle.openPrice, candle.closePrice);
  const lowerWick =
    Math.min(candle.openPrice, candle.closePrice) - candle.lowPrice;

  return (
    body / range < 0.3 && // тело маленькое
    (upperWick / range > 0.4 || lowerWick / range > 0.4) // хвост большой
  );
}

/**
 * Проверка: молот / hammer (или inverted hammer)
 * Тело маленькое, длинный нижний хвост.
 */
function isHammer(candle: KlineDataItem): boolean {
  const body = Math.abs(candle.closePrice - candle.openPrice);
  const range = candle.highPrice - candle.lowPrice;
  const lowerWick =
    Math.min(candle.openPrice, candle.closePrice) - candle.lowPrice;

  return (
    body / range < 0.3 && // маленькое тело
    lowerWick / range > 0.5 // длинный нижний хвост
  );
}

/**
 * Проверка: доджи.
 * Открытие почти равно закрытию, тело очень маленькое.
 */
function isDoji(candle: KlineDataItem): boolean {
  const body = Math.abs(candle.closePrice - candle.openPrice);
  const range = candle.highPrice - candle.lowPrice;

  return body / range < 0.05;
}

/**
 * Проверка: бычье поглощение.
 * Следующая свеча закрылась выше high предыдущей и открылась ниже low предыдущей.
 */
function isBullishEngulfing(prev: KlineDataItem, curr: KlineDataItem): boolean {
  return (
    prev.closePrice < prev.openPrice && // предыдущая медвежья
    curr.closePrice > curr.openPrice && // текущая бычья
    curr.openPrice < prev.closePrice &&
    curr.closePrice > prev.openPrice
  );
}

/**
 * Проверка: медвежье поглощение.
 */
function isBearishEngulfing(prev: KlineDataItem, curr: KlineDataItem): boolean {
  return (
    prev.closePrice > prev.openPrice && // предыдущая бычья
    curr.closePrice < curr.openPrice && // текущая медвежья
    curr.openPrice > prev.closePrice &&
    curr.closePrice < prev.openPrice
  );
}
