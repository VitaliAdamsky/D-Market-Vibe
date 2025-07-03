import { load } from "dotenv/mod.ts";
import { Coin } from "#models/coin.ts";
import { TF } from "#models/timeframes.ts";
import { delay } from "#shared/utils/delay/delay.ts";
import { getPLimit } from "#shared/utils/p-limit.ts";
import { getBybitKlineInterval } from "#shared/intervals/get-bybit-kline-interval.ts";
import { BybitApiResponse, BybitRawKline } from "#kline/models/bybit.ts";

import { SpotFetchResult, SpotKlineItem } from "#kline/models/spot.ts";
import { bybitSpotUrl } from "#kline/urls/bybit-spot-url.ts";

const env = await load();
const CONCURRENCY_LIMIT = Number(env.CONCURRENCY_LIMIT) || 20;

/**
 * Загружает и обрабатывает исторические данные (Klines) для списка монет
 * с Bybit Spot.
 * @param coins - Массив объектов монет для загрузки.
 * @param timeframe - Таймфрейм свечей.
 * @param limit - Количество свечей для загрузки.
 * @returns Промис, который разрешается в массив результатов для каждой монеты.
 */
export async function fetchBybitSpotKlines(
  coins: Coin[],
  timeframe: TF,
  limit: number
): Promise<SpotFetchResult[]> {
  const limitConcurrency = await getPLimit(CONCURRENCY_LIMIT);
  const bybitInterval = getBybitKlineInterval(timeframe);

  const fetchKlineForCoin = async (coin: Coin): Promise<SpotFetchResult> => {
    try {
      const url = bybitSpotUrl(coin.symbol, bybitInterval, limit);
      // ИСПРАВЛЕНО: Использование `env` вместо `process.env` для консистентности
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

      const data: SpotKlineItem[] = rawEntries
        .filter(
          (entry): entry is BybitRawKline =>
            Array.isArray(entry) && entry.length >= 7
        )
        .map((entry) => ({
          symbol: coin.symbol,
          openTime: Number(entry[0]),
          closePrice: Number(entry[4]),
        }));

      return {
        success: true,
        data: {
          symbol: coin.symbol,
          category: coin.category || "unknown",
          exchanges: coin.exchanges || [],
          imageUrl: coin.imageUrl || "assets/img/noname.png",
          data: data.slice(0, -1), // Отбрасываем последнюю свечу (незавершенную)
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
