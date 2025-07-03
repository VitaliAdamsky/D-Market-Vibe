import { Coin } from "#models/coin.ts";
import { TF } from "#models/timeframes.ts";
import { getBinanceKlineInterval } from "#shared/intervals/get-binance-kline-interval.ts";
import { delay } from "#shared/utils/delay/delay.ts";
import { getPLimit } from "#shared/utils/p-limit.ts";
import { load } from "dotenv/mod.ts";
import { BinanceRawKline } from "#kline/models/binance.ts";
import { binanceSpotUrl } from "#kline/urls/binance-sport-url.ts";
import { SpotFetchResult, SpotKlineItem } from "#kline/models/spot.ts";

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
 * Тип для обработанной свечи со спотового рынка.
 */

/**
 * Загружает и обрабатывает исторические данные (Klines) для списка монет
 * с Binance Spot.
 * @param coins - Массив объектов монет для загрузки.
 * @param timeframe - Таймфрейм свечей.
 * @param limit - Количество свечей для загрузки.
 * @returns Промис, который разрешается в массив результатов для каждой монеты.
 */
export async function fetchBinanceSpotKlines(
  coins: Coin[],
  timeframe: TF,
  limit: number
): Promise<SpotFetchResult[]> {
  const limitConcurrency = await getPLimit(CONCURRENCY_LIMIT);
  const binanceInterval = getBinanceKlineInterval(timeframe);

  const fetchKlineForCoin = async (coin: Coin): Promise<SpotFetchResult> => {
    try {
      const headers = new Headers({
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        Origin: "https://www.binance.com",
        Referer: "https://www.binance.com/",
      });

      const url = binanceSpotUrl(coin.symbol, binanceInterval, limit);
      // ИСПРАВЛЕНО: Использование `env` вместо `process.env` для консистентности
      await delay(Number(env.FETCH_DELAY) || 100);
      const response = await fetch(url, { headers });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching ${coin.symbol}:`, errorText);
        return { success: false, symbol: coin.symbol };
      }

      const responseData: unknown = await response.json();

      if (!Array.isArray(responseData)) {
        console.error(
          `Invalid response structure for ${coin.symbol}:`,
          responseData
        );
        return { success: false, symbol: coin.symbol };
      }

      const data = responseData
        .map((entry: unknown) => entry as BinanceRawKline)
        .sort((a, b) => a[0] - b[0])
        .map(
          (entry): SpotKlineItem => ({
            symbol: coin.symbol,
            openTime: entry[0], // Уже является числом
            closePrice: parseFloat(entry[4]),
          })
        );

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
