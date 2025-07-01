// initializeOpenInterestStore.js
const {
  getServantConfig,
} = require("@global/servants/servant-config/service.js");

const {
  fetchOpenInterestData,
} = require("@oi/functions/fetches/fetch-oi-data.js");
const { setOpenInterestCache } = require("@oi/cache/service.js");
const { VALID_TIMEFRAMES } = require("@oi/config/timeframe.config.js");

async function initializeOpenInterestStore() {
  const limit = getServantConfig().limitOi;
  for (const config of VALID_TIMEFRAMES) {
    const { timeframe, delay: delayMs } = config;

    console.log(
      `⏱ OI Store [${timeframe}] will init after ${delayMs / 60000} min`
    );

    setTimeout(async () => {
      try {
        const data = await fetchOpenInterestData(timeframe, limit);
        setOpenInterestCache(timeframe, data);

        console.log(
          `🟢 OI [${timeframe}] Cache initialized | Data size: ${data.data.length}`
        );
      } catch (err) {
        console.error(
          `❌ OI [${timeframe}] failed to initialize cache:`,
          err.message || err
        );
      }
    }, delayMs);
  }
}

module.exports = { initializeOpenInterestStore };
