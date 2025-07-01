// initializeKlineStore.js
const {
  getServantConfig,
} = require("@global/servants/servant-config/service.js");

const {
  fetchKlineData,
} = require("@kline/functions/fetches/fetch-kline-data.js");

const { setKlineCache } = require("@kline/cache/service.js");

const { VALID_TIMEFRAMES } = require("@kline/config/timeframe.config.js");

async function initializeKlineStore() {
  for (const config of VALID_TIMEFRAMES) {
    const { timeframe, delay: delayMs } = config;

    console.log(
      `⏱ Kline Store [${timeframe}] will init after ${delayMs / 60000} min`
    );

    setTimeout(async () => {
      try {
        const limit = getServantConfig().limitKline;
        const data = await fetchKlineData(timeframe, limit);
        setKlineCache(timeframe, data);

        console.log(
          `💛 Kline [${timeframe}] Cache initialized | Data size: ${data.data.length}`
        );
      } catch (err) {
        console.error(
          `❌ Kline [${timeframe}] failed to initialize cache:`,
          err.message || err
        );
        console.log(err.stack);
      }
    }, delayMs);
  }
}

module.exports = { initializeKlineStore };
