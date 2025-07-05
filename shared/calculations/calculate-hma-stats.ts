import { KlineData } from "#kline/models/kline.ts";
import { HmaStatsData, HmaStatsItem } from "#kline/models/hma-stats.ts";
import { TF } from "#models/timeframes.ts";

/**
 * Рассчитывает Hull Moving Average (HMA) по закрытию.
 * @param data Массив цен
 * @param length Длина HMA
 */
function calculateHMA(data: number[], length: number): number[] {
  const wma = (prices: number[], len: number) => {
    return prices.map((_, i) => {
      if (i < len - 1) return NaN;
      const slice = prices.slice(i - len + 1, i + 1);
      const denominator = (len * (len + 1)) / 2;
      const weightedSum = slice.reduce(
        (sum, price, idx) => sum + price * (idx + 1),
        0
      );
      return weightedSum / denominator;
    });
  };

  const wmaHalf = wma(data, Math.round(length / 2));
  const wmaFull = wma(data, length);
  const diff = wmaHalf.map((v, i) => 2 * v - wmaFull[i]);
  const hma = wma(diff, Math.round(Math.sqrt(length)));
  return hma;
}

/**
 * Основная функция для расчёта HMA статистики
 */
export function calculateHmaStatsData(
  klines: KlineData[],
  timeframe: TF,
  projectName: string,
  expirationTime: number
): HmaStatsData {
  const stats: HmaStatsItem[] = [];

  klines.forEach((coin) => {
    const closes = coin.data.map((item) => item.closePrice);
    const hma = calculateHMA(closes, 20);

    let bullishCandle = 0;
    let aboveHma = 0;
    let belowHma = 0;
    let crossHmaUp = 0;
    let crossHmaDown = 0;

    for (let i = 1; i < coin.data.length; i++) {
      const item = coin.data[i];
      const prevItem = coin.data[i - 1];
      const price = item.closePrice;
      const hmaVal = hma[i];
      if (isNaN(hmaVal)) continue;

      if (price > hmaVal) aboveHma++;
      else if (price < hmaVal) belowHma++;

      const prevPrice = prevItem.closePrice;
      const prevHmaVal = hma[i - 1];
      if (isNaN(prevHmaVal)) continue;

      if (prevPrice < prevHmaVal && price > hmaVal) crossHmaUp++;
      else if (prevPrice > prevHmaVal && price < hmaVal) crossHmaDown++;

      if (item.closePrice > item.openPrice) bullishCandle++;
    }

    const lastItem = coin.data.at(-1)!;

    stats.push({
      openTime: lastItem.openTime,
      closeTime: lastItem.closeTime,
      bullishCandle,
      aboveHma,
      belowHma,
      crossHmaUp,
      crossHmaDown,
    });
  });

  return {
    projectName,
    timeframe,
    expirationTime,
    data: stats.slice(-50),
  };
}
