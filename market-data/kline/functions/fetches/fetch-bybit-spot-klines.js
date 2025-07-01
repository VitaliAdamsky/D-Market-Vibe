const {
  getBybitKlineInterval,
} = require("@shared/intervals/get-bybit-kline-interval.js");

const { bybitSpotUrl } = require("@kline/urls/bybit-spot-url.js");

const { getPLimit } = require("@shared/utils/p-limit.js");

const { delay } = require("@shared/utils/delay/delay.js");

const CONCURRENCY_LIMIT = Number(process.env.CONCURRENCY_LIMIT) || 20;

async function fetchBybitSpotKlines(coins, timeframe, limit) {
  const limitConcurrency = await getPLimit(CONCURRENCY_LIMIT);

  const bybitInterval = getBybitKlineInterval(timeframe);

  const fetchKlineForCoin = async (coin) => {
    try {
      const url = bybitSpotUrl(coin.symbol, bybitInterval, limit);

      await delay(Number(process.env.FETCH_DELAY) || 100);

      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching ${coin.symbol}:`, errorText);
        return { success: false, symbol: coin.symbol };
      }

      const responseData = await response.json();

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

      const rawEntries = responseData.result.list.sort((a, b) => a[0] - b[0]);

      const data = rawEntries
        .filter((entry) => Array.isArray(entry) && entry.length >= 7)
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
          data: data.slice(0, -1), // Drop the last candle (incomplete)
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

module.exports = { fetchBybitSpotKlines };
