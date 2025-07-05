import { HmaActionData, HmaAction } from "#kline/models/hma-action.ts";
import { KlineData } from "#kline/models/kline.ts";
import { TF } from "#models/timeframes.ts";

function calculateHMA(closes: number[], length: number): number[] {
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

  const wmaHalf = wma(closes, Math.round(length / 2));
  const wmaFull = wma(closes, length);
  const diff = wmaHalf.map((v, i) => 2 * v - wmaFull[i]);
  const hma = wma(diff, Math.round(Math.sqrt(length)));
  return hma;
}

export function calculateHmaAction(
  klines: KlineData[],
  timeframe: TF,
  projectName: string,
  expirationTime: number
): HmaActionData {
  const actionsMap = new Map<number, HmaAction>();

  klines.forEach((coin) => {
    const closes = coin.data.map((item) => item.closePrice);
    const hma = calculateHMA(closes, 20);
    const lastItems = coin.data.slice(-11); // Берём 11 свечей для сравнения

    for (let i = 1; i < lastItems.length; i++) {
      const prevClose = lastItems[i - 1].closePrice;
      const currClose = lastItems[i].closePrice;

      const prevHma = hma[hma.length - lastItems.length + i - 1];
      const currHma = hma[hma.length - lastItems.length + i];

      const openTime = lastItems[i].openTime;
      const closeTime = lastItems[i].closeTime;

      let crossHmaUp = false;
      let crossHmaDown = false;

      if (prevClose < prevHma && currClose > currHma) {
        crossHmaUp = true;
      } else if (prevClose > prevHma && currClose < currHma) {
        crossHmaDown = true;
      }

      if (!actionsMap.has(openTime)) {
        actionsMap.set(openTime, {
          openTime,
          closeTime,
          crossHmaUp: [],
          crossHmaDown: [],
        });
      }

      const action = actionsMap.get(openTime)!;

      if (crossHmaUp) action.crossHmaUp.push(coin.symbol);
      if (crossHmaDown) action.crossHmaDown.push(coin.symbol);
    }
  });

  const actions = Array.from(actionsMap.values()).sort(
    (a, b) => a.openTime - b.openTime
  );

  return {
    projectName,
    timeframe,
    expirationTime,
    data: actions,
  };
}
