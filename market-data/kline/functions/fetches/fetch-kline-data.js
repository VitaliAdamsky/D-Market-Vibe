// open-interest.service.js
const {
  mergeSpotWithPerps,
} = require("@kline/functions/processing/merge-spot-with-perps");

const {
  calculateExpirationTime,
} = require("@shared/calculations/calculate-expiration-time.js");

const { getBinanceDominantCache } = require("@coins/cache/service.js");

const {
  normalizeKlineData,
} = require("@kline/functions/processing/normalize-kline-data");

const {
  handleFetchWithFailureTracking,
} = require("@shared/general/handle-fetch-with-failure-tracking.js");

const {
  fetchBinancePerpKlines,
} = require("@kline/functions/fetches/fetch-binance-perp-klines");

const {
  fetchBybitPerpKlines,
} = require("@kline/functions/fetches/fetch-bybit-perp-klines.js");

const {
  fetchBinanceSpotKlines,
} = require("@kline/functions/fetches/fetch-binance-spot-klines.js");

const {
  fetchBybitSpotKlines,
} = require("@kline/functions/fetches/fetch-bybit-spot-klines.js");

const {
  addFailedCoinsToCache,
} = require("@kline/functions/processing/add-failed-coins-to-cache.js");

const {
  getServantConfig,
} = require("@global/servants/servant-config/service.js");

async function fetchKlineData(timeframe, limit) {
  const { binancePerps, binanceSpot, bybitPerps, bybitSpot } =
    getBinanceDominantCache();

  const [
    binanceKlinePerpData,
    bybitKlinePerpData,
    binanceKlineSpotData,
    bybitKlineSpotData,
  ] = await Promise.all([
    handleFetchWithFailureTracking(
      fetchBinancePerpKlines,
      binancePerps,
      timeframe,
      limit,
      addFailedCoinsToCache,
      "perp",
      "Binance"
    ),
    handleFetchWithFailureTracking(
      fetchBybitPerpKlines,
      bybitPerps,
      timeframe,
      limit,
      addFailedCoinsToCache,
      "perp",
      "Bybit"
    ),
    handleFetchWithFailureTracking(
      fetchBinanceSpotKlines,
      binanceSpot,
      timeframe,
      limit,
      addFailedCoinsToCache,
      "spot",
      "Binance"
    ),
    handleFetchWithFailureTracking(
      fetchBybitSpotKlines,
      bybitSpot,
      timeframe,
      limit,
      addFailedCoinsToCache,
      "spot",
      "Bybit"
    ),
  ]);

  //3. Calculate when this data should expire
  const lastOpenTime =
    bybitKlinePerpData[0]?.data?.at(-1)?.openTime ??
    bybitKlinePerpData[0]?.data?.at(-1)?.openTime;

  const expirationTime = calculateExpirationTime(lastOpenTime, timeframe);

  let data = mergeSpotWithPerps(
    [...binanceKlinePerpData, ...bybitKlinePerpData],
    [...binanceKlineSpotData, ...bybitKlineSpotData]
  );

  //4. Normalize and merge
  data = normalizeKlineData([...data]);
  data = data.filter((coinData) => coinData.data.length > 0);
  const emptyCoins = data
    .filter((coinData) => coinData.data.length === 0)
    .map((coinData) => coinData.symbol);
  console.log("Empty coins:", emptyCoins);

  return {
    projectName: getServantConfig().projectName,
    dataType: "kline",
    timeframe,
    expirationTime,
    data,
  };
}

module.exports = { fetchKlineData };
