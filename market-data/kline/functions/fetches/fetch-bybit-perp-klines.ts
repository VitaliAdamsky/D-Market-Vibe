import { load } from "dotenv/mod.ts";
import { Coin } from "#models/coin.ts";
import { TF } from "#models/timeframes.ts";
import { delay } from "#shared/utils/delay/delay.ts";
import { getPLimit } from "#shared/utils/p-limit.ts";
import { FetchResult } from "#kline/models/perp-fetch.ts";
import { calculateCloseTime } from "#shared/calculations/calculate-close-time.ts";
import { getBybitKlineInterval } from "#shared/intervals/get-bybit-kline-interval.ts";
import { getIntervalDurationMs } from "#shared/utils/get-interval-duration-ms.ts";
import { bybitPerpUrl } from "#kline/urls/bybit-perps-url.ts";
import { BybitApiResponse, BybitRawKline } from "#kline/models/bybit.ts";
import { KlineDataItem } from "../../models/kline.ts";

/**
 * Загружает и обрабатывает исторические данные (Klines) для списка монет
 * с Binance Futures.
 * @param coins - Массив объектов монет для загрузки.
 * @param timeframe - Таймфрейм свечей.
 * @param limit - Количество свечей для загрузки.
 * @returns Промис, который разрешается в массив результатов для каждой монеты.
 */
const env = await load();
const CONCURRENCY_LIMIT = Number(env.CONCURRENCY_LIMIT) || 20;

/**
 * Загружает и обрабатывает исторические данные (Klines) для списка монет
 * с Bybit Perpetuals.
 * @param coins - Массив объектов монет для загрузки.
 * @param timeframe - Таймфрейм свечей.
 * @param limit - Количество свечей для загрузки.
 * @returns Промис, который разрешается в массив результатов для каждой монеты.
 */
export async function fetchBybitPerpKlines(
  coins: Coin[],
  timeframe: TF,
  limit: number
): Promise<FetchResult[]> {
  const limitConcurrency = await getPLimit(CONCURRENCY_LIMIT);
  const intervalMs = getIntervalDurationMs(timeframe);
  const bybitInterval = getBybitKlineInterval(timeframe);

  const fetchKlineForCoin = async (coin: Coin): Promise<FetchResult> => {
    try {
      const url = bybitPerpUrl(coin.symbol, bybitInterval, limit);
      await delay(Number(env.FETCH_DELAY) || 100);
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching ${coin.symbol}:`, errorText);
        return { success: false, symbol: coin.symbol };
      }

      const responseData: BybitApiResponse = await response.json();

      if (
        !responseData?.result?.list ||
        !Array.isArray(responseData.result.list)
      ) {
        console.error(
          `Invalid response structure for ${coin.symbol}:`,
          responseData
        );
        return { success: false, symbol: coin.symbol };
      }

      const rawEntries = responseData.result.list.sort(
        (a, b) => Number(a[0]) - Number(b[0])
      );

      const data: KlineDataItem[] = rawEntries
        .filter(
          (entry): entry is BybitRawKline =>
            Array.isArray(entry) && entry.length >= 7
        )
        .map((entry) => ({
          openTime: Number(entry[0]),
          closeTime: calculateCloseTime(Number(entry[0]), intervalMs),
          highPrice: Number(entry[2]),
          openPrice: Number(entry[1]),
          lowPrice: Number(entry[3]),
          closePrice: Number(entry[4]),
          // В Bybit API 7-й элемент (индекс 6) - это оборот в котируемой валюте (turnover), что эквивалентно quoteVolume
          quoteVolume: Number(entry[6]),
        }));

      return {
        success: true,
        data: {
          symbol: coin.symbol,
          category: coin.category || "unknown",
          exchanges: coin.exchanges || [],
          imageUrl: coin.imageUrl || "assets/img/noname.png",
          data: data.slice(1, -1),
        },
      };
    } catch (error) {
      console.error(`Error processing ${coin.symbol}:`, error);
      return { success: false, symbol: coin.symbol };
    }
  };

  const promises = coins.map((coin) =>
    limitConcurrency(() => fetchKlineForCoin(coin))
  );

  return Promise.all(promises);
}
