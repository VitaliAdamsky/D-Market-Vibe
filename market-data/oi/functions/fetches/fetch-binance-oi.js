const {
  getBinanceKlineInterval,
} = require("@shared/intervals/get-binance-kline-interval.js");

const { binanceOiUrl } = require("@oi/urls/binance-oi-url.js");

const {
  calculateCloseTime,
} = require("@shared/calculations/calculate-close-time.js");

const {
  getIntervalDurationMs,
} = require("@shared/utils/get-interval-duration-ms.js");

const { getPLimit } = require("@shared/utils/p-limit.js");

const { delay } = require("@shared/utils/delay/delay.js");

const CONCURRENCY_LIMIT = Number(process.env.CONCURRENCY_LIMIT) || 20;

async function fetchBinanceOi(coins, timeframe, limit) {
  const limitConcurrency = await getPLimit(CONCURRENCY_LIMIT);

  const binanceInterval = getBinanceKlineInterval(timeframe);
  const intervalMs = getIntervalDurationMs(timeframe);

  const fetchOiData = async (coin) => {
    try {
      const headers = new Headers();
      headers.set(
        "User-Agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
      );
      headers.set("Accept", "*/*");
      headers.set("Accept-Language", "en-US,en;q=0.9");
      headers.set("Origin", "https://www.binance.com");
      headers.set("Referer", "https://www.binance.com/");

      const url = binanceOiUrl(coin.symbol, binanceInterval, limit);
      await delay(Number(process.env.FETCH_DELAY) || 100);
      const response = await fetch(url, { headers });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching ${coin.symbol}:`, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      if (!Array.isArray(responseData)) {
        console.error(
          `Invalid response structure for ${coin.symbol}:`,
          responseData
        );
        throw new Error(`Invalid response structure for ${coin.symbol}`);
      }

      const sortedData = responseData.sort(
        (a, b) => Number(a.timestamp) - Number(b.timestamp)
      );

      const data = sortedData.map((entry, index, arr) => {
        const currentValue = Number(entry.sumOpenInterestValue);
        let openInterestChange = null;

        if (index > 0) {
          const prevValue = Number(arr[index - 1].sumOpenInterestValue);
          if (prevValue !== 0) {
            openInterestChange = Number(
              (
                ((currentValue - prevValue) / Math.abs(prevValue)) *
                100
              ).toFixed(2)
            );
          } else {
            openInterestChange = currentValue !== 0 ? 100 : 0;
          }
        }

        return {
          openTime: Number(entry.timestamp),
          closeTime: calculateCloseTime(Number(entry.timestamp), intervalMs),
          symbol: coin.symbol,
          openInterest: Number(currentValue.toFixed(2)),
          openInterestChange:
            openInterestChange !== null
              ? Number(openInterestChange.toFixed(2))
              : null,
        };
      });

      const cleanedData = data.slice(1, -1);

      return {
        symbol: coin.symbol,
        exchanges: coin.exchanges || [],
        imageUrl: coin.imageUrl || "",
        category: coin.category || "",
        data: cleanedData,
      };
    } catch (error) {
      console.error(`Error processing ${coin.symbol}:`, error);
      return { symbol: coin.symbol, data: [] };
    }
  };

  const promises = coins.map((coin) =>
    limitConcurrency(() => fetchOiData(coin))
  );

  return Promise.all(promises);
}

module.exports = { fetchBinanceOi };
