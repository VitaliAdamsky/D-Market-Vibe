import { KlineDataItem } from "../../models/kline.ts";
import { Coin } from "#models/coin.ts";
import { TF } from "#models/timeframes.ts";
import { getBinanceKlineInterval } from "#shared/intervals/get-binance-kline-interval.ts";
import { delay } from "#shared/utils/delay/delay.ts";
import { getPLimit } from "#shared/utils/p-limit.ts";
import { binancePerpsUrl } from "#kline/urls/binance-perps-url.ts";
import { load } from "dotenv/mod.ts";
import { BinanceRawKline } from "#kline/models/binance.ts";
import { FetchResult } from "../../models/perp-fetch.ts";

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

export async function fetchBinancePerpKlines(
  coins: Coin[],
  timeframe: TF,
  limit: number
): Promise<FetchResult[]> {
  const limitConcurrency = await getPLimit(CONCURRENCY_LIMIT);
  const binanceInterval = getBinanceKlineInterval(timeframe);

  const fetchKlineForCoin = async (coin: Coin): Promise<FetchResult> => {
    try {
      const headers = new Headers({
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        Origin: "https://www.binance.com",
        Referer: "https://www.binance.com/",
      });

      const url = binancePerpsUrl(coin.symbol, binanceInterval, limit);
      await delay(Number(env.FETCH_DELAY) || 100);
      const response = await fetch(url, { headers });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching ${coin.symbol}:`, errorText);
        return { success: false, symbol: coin.symbol };
      }

      const responseData: unknown = await response.json();

      // Проверка, что ответ является массивом
      if (!Array.isArray(responseData)) {
        console.error(
          `Invalid response structure for ${coin.symbol}:`,
          responseData
        );
        return { success: false, symbol: coin.symbol };
      }

      const data = responseData
        // Приведение к типу для безопасности и автодополнения
        .map((entry: unknown) => entry as BinanceRawKline)
        .sort((a, b) => a[0] - b[0])
        .map((entry): KlineDataItem => {
          const baseVolume = parseFloat(entry[5]);
          const takerBuyBase = parseFloat(entry[9]);
          const takerBuyQuote = parseFloat(entry[10]);
          const totalQuoteVolume = parseFloat(entry[7]);

          // Расчет соотношения покупателей в процентах с двумя знаками после запятой
          const buyerRatio =
            baseVolume > 0
              ? Math.round((takerBuyBase / baseVolume) * 10000) / 100
              : 0;

          const sellerQuoteVolume = totalQuoteVolume - takerBuyQuote;
          const volumeDelta = takerBuyQuote - sellerQuoteVolume;

          return {
            highPrice: parseFloat(entry[2]),
            lowPrice: parseFloat(entry[3]),
            openTime: entry[0],
            closeTime: entry[6],
            closePrice: parseFloat(entry[4]),
            quoteVolume: totalQuoteVolume,
            buyerRatio: buyerRatio,
            volumeDelta: parseFloat(volumeDelta.toFixed(2)),
          };
        });

      return {
        success: true,
        data: {
          symbol: coin.symbol,
          category: coin.category || "unknown",
          exchanges: coin.exchanges || [],
          imageUrl: coin.imageUrl || "assets/img/noname.png",
          // Обрезаем первую и последнюю свечу, как в оригинале
          data: data.slice(1, -1),
        },
      };
    } catch (error) {
      console.error(`Error processing ${coin.symbol}:`, error);
      return { success: false, symbol: coin.symbol };
    }
  };

  // Ограничиваем количество одновременных запросов
  const promises = coins.map((coin) =>
    limitConcurrency(() => fetchKlineForCoin(coin))
  );

  return Promise.all(promises);
}
