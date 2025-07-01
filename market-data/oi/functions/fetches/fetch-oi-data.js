const {
  getBinanceDominantCache,
  getBybitDominantCache,
} = require("@coins/cache/service.js");

const { fetchBinanceOi } = require("@oi/functions/fetches/fetch-binance-oi.js");

const { fetchBybitOi } = require("@oi/functions/fetches/fetch-bybit-oi.js");

const {
  calculateExpirationTime,
} = require("@shared/calculations/calculate-expiration-time.js");

const {
  normalizeOpenInterestData,
} = require("@oi/functions/processing/normalize-oi-data.js");

const {
  getServantConfig,
} = require("@global/servants/servant-config/service.js");

async function fetchOpenInterestData(timeframe, limit) {
  let coins; // Declare coins as a variable
  const isDaily = timeframe === "D";

  if (isDaily) {
    const { binancePerps, bybitPerps } = getBybitDominantCache();
    coins = { binancePerps, bybitPerps }; // Assign an object to coins
  } else {
    const { binancePerps, bybitPerps } = getBinanceDominantCache();
    coins = { binancePerps, bybitPerps }; // Assign an object to coins
  }

  const binancePerpCoins = coins.binancePerps;
  const bybitPerpCoins = coins.bybitPerps;

  // 2. Concurrently fetch OI data from both exchanges
  const [binanceOiData, bybitOiData] = await Promise.all([
    fetchBinanceOi(binancePerpCoins, timeframe, limit),
    fetchBybitOi(bybitPerpCoins, timeframe, limit),
  ]);

  // 3. Calculate when this data should expire
  const lastOpenTime =
    binanceOiData[0]?.data?.at(-1)?.openTime ??
    bybitOiData[0]?.data?.at(-1)?.openTime;
  const expirationTime = calculateExpirationTime(lastOpenTime, timeframe);

  // 4. Normalize and merge
  let data = normalizeOpenInterestData([...binanceOiData, ...bybitOiData]);

  data = data.filter((coinData) => coinData.data.length > 0);

  return {
    projectName: getServantConfig().projectName,
    dataType: "oi",
    expirationTime,
    timeframe,
    data,
  };
}

module.exports = { fetchOpenInterestData };
